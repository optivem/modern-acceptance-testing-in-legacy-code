param(
    [ValidateSet("local", "pipeline")]
    [string]$Mode = "local",

    [switch]$Restart,
    [switch]$SkipTests,

    [int]$LogLines = 50,

    [string]$WorkingDirectory = (Get-Location).Path
)

# Constants
$TestConfigFileName = "Run-SystemTests.Config.ps1"

# Load configuration
$SystemConfig = @{
    # Docker Configuration
    ContainerName = "modern-acceptance-testing-in-legacy-code"

    # System Components (our application services)
    SystemComponents = @(
        @{ Name = "Frontend";
            Url = "http://localhost:3001";
            ContainerName = "frontend";
            BuildPath = "frontend";
            InstallCommand = "npm install";
            BuildCommand = "npm run build" }
        @{ Name = "Backend API";
            Url = "http://localhost:8081/health";
            ContainerName = "backend";
            BuildPath = "backend";
            InstallCommand = $null;
            BuildCommand = "& .\gradlew.bat clean build" }
        @{ Name = "External Systems";
            Url = $null;
            ContainerName = $null;
            BuildPath = $null;
            InstallCommand = $null;
            BuildCommand = $null }
    )

    # External Systems (third-party/mock APIs)
    ExternalSystems = @(
        @{ Name = "ERP API";
            Url = "http://localhost:9001/erp/health";
            ContainerName = "external" }
        @{ Name = "Tax API";
            Url = "http://localhost:9001/tax/health";
            ContainerName = "external" }
    )
}

# Load test configuration only if tests will be run
if (-not $SkipTests) {
    Write-Host "Loading test configuration..." -ForegroundColor Cyan
    $TestConfigPath = "$WorkingDirectory\$TestConfigFileName"
    Write-Host "Test configuration path: $TestConfigPath" -ForegroundColor Cyan

    if (-not (Test-Path $TestConfigPath)) {
        Write-Host "ERROR: Test configuration file not found at path: $TestConfigPath" -ForegroundColor Red
        Set-Location $WorkingDirectory
        exit 1
    }

    $TestConfig = . $TestConfigPath
    $TestInstallCommands = $TestConfig.TestInstallCommands
    $SmokeTestCommand = $TestConfig.SmokeTestCommand
    $E2ETestCommand = $TestConfig.E2ETestCommand
    $TestReportPath = Join-Path "$WorkingDirectory\system-test" $TestConfig.TestReportPath
}

# Script Configuration
$ErrorActionPreference = "Continue"
$MaxAttempts = 10
$ComposeFile = if ($Mode -eq "pipeline") { "docker-compose.pipeline.yml" } else { "docker-compose.local.yml" }

# Extract configuration values
$ContainerName = $SystemConfig.ContainerName

# Extract component arrays
$SystemComponents = $SystemConfig.SystemComponents
$ExternalSystems = $SystemConfig.ExternalSystems

function Execute-Command {
    param(
        [string]$Command,
        [string]$Path = $null
    )

    $OriginalLocation = Get-Location

    try {
        if ($Path) {
            Write-Host "Changing directory to: $Path" -ForegroundColor Cyan
            Set-Location $Path
        }

        Write-Host "Executing: $Command" -ForegroundColor Cyan

        $output = Invoke-Expression $Command 2>&1
        $exitCode = $LASTEXITCODE

        # Display the output
        if ($output) {
            $output | ForEach-Object { Write-Host $_ }
        }

        if ($exitCode -ne 0 -and $null -ne $exitCode) {
            Write-Host ""
            Write-Host "Working directory: $(Get-Location)" -ForegroundColor Red
            Write-Host "Command: $Command" -ForegroundColor Red
            Write-Host "Command failed with exit code: $exitCode" -ForegroundColor Red
            throw "Failed to execute command: $Command (Exit Code: $exitCode)"
        }

        return $output

    } finally {
        if ($Path) {
            Set-Location $OriginalLocation
        }
    }
}

function Test-PowerShellVersion {
    $psVersion = $PSVersionTable.PSVersion
    
    if ($psVersion.Major -lt 7) {
        Write-Host "[✗] PowerShell 7+ required. Found: $($psVersion.Major).$($psVersion.Minor)" -ForegroundColor Red
        Write-Host "    Download: https://github.com/PowerShell/PowerShell" -ForegroundColor Yellow
        throw "PowerShell 7+ is required"
    }
}

function Test-JavaVersion {
    $javaOutput = & java -version 2>&1
    $javaVersionString = ($javaOutput | Out-String)
    
    if (-not ($javaVersionString -match 'version "(\d+)\.')) {
        Write-Host "[✗] Could not determine Java version" -ForegroundColor Red
        Write-Host "    Download: https://adoptium.net/" -ForegroundColor Yellow
        throw "Could not determine Java version"
    }
    
    $javaMajor = [int]$matches[1]
    if ($javaMajor -ne 21) {
        Write-Host "[✗] Java 21 required. Found: Java $javaMajor" -ForegroundColor Red
        Write-Host "    Download: https://adoptium.net/" -ForegroundColor Yellow
        throw "Java 21 is required"
    }
}

function Test-NodeVersion {
    $nodeOutput = & node --version 2>&1
    $nodeVersion = ($nodeOutput | Out-String).Trim()
    
    if (-not ($nodeVersion -match 'v(\d+)\.')) {
        Write-Host "[✗] Could not determine Node version" -ForegroundColor Red
        Write-Host "    Download: https://nodejs.org/" -ForegroundColor Yellow
        throw "Could not determine Node version"
    }
    
    $nodeMajor = [int]$matches[1]
    if ($nodeMajor -lt 22) {
        Write-Host "[✗] Node 22+ required. Found: Node $nodeMajor" -ForegroundColor Red
        Write-Host "    Download: https://nodejs.org/" -ForegroundColor Yellow
        throw "Node 22+ is required"
    }
}

function Test-DockerDesktop {
    $dockerOutput = & docker --version 2>&1
    $dockerVersion = ($dockerOutput | Out-String).Trim()
    
    if (-not ($dockerVersion -match 'Docker version')) {
        Write-Host "[✗] Docker Desktop not found" -ForegroundColor Red
        Write-Host "    Download: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
        throw "Docker Desktop is required"
    }
    
    # Check if Docker daemon is running
    $dockerInfo = & docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[✗] Docker daemon is not running. Please start Docker Desktop." -ForegroundColor Red
        throw "Docker daemon is not running"
    }
}

function Test-Prerequisites {
    Test-PowerShellVersion
    Test-JavaVersion
    Test-NodeVersion
    Test-DockerDesktop
}



function Wait-ForService {
    param(
        [string]$Url,
        [string]$ServiceName,
        [string]$ContainerName
    )

    $attempt = 0
    $isReady = $false

    while (-not $isReady -and $attempt -lt $MaxAttempts) {
        try {
            $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                $isReady = $true
            }
        } catch {
            $attempt++
            Start-Sleep -Seconds 1
        }
    }

    if (-not $isReady) {
        Execute-Command -Command "docker compose -f $ComposeFile logs $ContainerName --tail=$LogLines"
        throw "$ServiceName failed to become ready after $MaxAttempts attempts"
    }
}

function Wait-ForServices {
    Write-Host "Waiting for external systems..." -ForegroundColor Yellow
    foreach ($system in $ExternalSystems) {
        Wait-ForService -Url $system.Url -ServiceName $system.Name -ContainerName $system.ContainerName
    }

    Write-Host "Waiting for system components..." -ForegroundColor Yellow
    foreach ($component in $SystemComponents) {
        if ($component.Url) {
            Wait-ForService -Url $component.Url -ServiceName $component.Name -ContainerName $component.ContainerName
        }
    }

    Write-Host ""
    Write-Host "All services are ready!" -ForegroundColor Green
}

function Build-System {
    if ($Mode -eq "local") {

        foreach ($component in $SystemComponents) {
            if ($component.InstallCommand) {
                Write-Host "Installing dependencies for $($component.Name)..." -ForegroundColor Cyan
                Execute-Command -Command $component.InstallCommand -Path $component.BuildPath
                Write-Host "Dependencies installed for $($component.Name)" -ForegroundColor Green
            }
        }

        foreach ($component in $SystemComponents) {
            if ($component.BuildCommand) {
                Write-Host "Building $($component.Name)..." -ForegroundColor Cyan
                Execute-Command -Command $component.BuildCommand -Path $component.BuildPath
            }
        }
    } else {
        Write-Host "Pipeline mode: Skipping build (using pre-built Docker images)" -ForegroundColor Cyan
    }
}

function Stop-System {
    Execute-Command -Command "docker compose -f docker-compose.local.yml down 2>`$null"
    Execute-Command -Command "docker compose -f docker-compose.pipeline.yml down 2>`$null"

    $ProjectContainers = Execute-Command -Command "docker ps -aq --filter 'name=$ContainerName' 2>`$null"
    if ($ProjectContainers) {
        Execute-Command -Command "docker stop $ProjectContainers 2>`$null"
        Execute-Command -Command "docker rm -f $ProjectContainers 2>`$null"
    }

    # Wait to ensure containers are fully stopped and ports are released
    Start-Sleep -Seconds 2
}

function Start-System {
    Execute-Command -Command "docker compose -f $ComposeFile up -d --build"

    Write-Host ""
    Write-Host "System Components:" -ForegroundColor Cyan
    foreach ($component in $SystemComponents) {
        Write-Host "- $($component.Name): " -NoNewline
        Write-Host $component.Url -ForegroundColor Yellow
    }

    Write-Host ""
    Write-Host "External Systems:" -ForegroundColor Cyan
    foreach ($system in $ExternalSystems) {
        Write-Host "- $($system.Name): " -NoNewline
        Write-Host $system.Url -ForegroundColor Yellow
    }
}

function Test-System-Selected {
    param(
        [string]$TestType,
        [string]$Command
    )

    Write-Host "Running $TestType tests..." -ForegroundColor Cyan

    try 
    {
        Execute-Command -Command $Command -Path "$WorkingDirectory\system-test"

        Write-Host ""
        Write-Host "All $TestType tests passed!" -ForegroundColor Green
    } catch {
        Write-Host ""
        Write-Host "Some $TestType tests failed." -ForegroundColor Red
        Write-Host "Test report: $TestReportPath"
        throw
    }
}

function Test-System {
    
    if($null -ne $TestInstallCommands) {
        Write-Host "Installing test dependencies..." -ForegroundColor Cyan

        # Install test dependencies
        foreach ($installCommand in $TestInstallCommands) { 
            Write-Host "Installing test dependencies with command: $installCommand" -ForegroundColor Cyan
            Execute-Command -Command $installCommand -Path "$WorkingDirectory\system-test"
        }
    } else {
        Write-Host "No test dependencies to install." -ForegroundColor Yellow
    }

    Test-System-Selected -TestType "smoke" -Command $SmokeTestCommand
    Test-System-Selected -TestType "e2e" -Command $E2ETestCommand
}

function Write-Heading {
    param(
        [string]$Text,
        [string]$Color = "Cyan"
    )
    Write-Host ""
    Write-Host "================================================" -ForegroundColor $Color
    Write-Host $Text -ForegroundColor $Color
    Write-Host "================================================" -ForegroundColor $Color
    Write-Host ""
}

function Test-SystemRunning {
    # Check if any of the external systems are responding
    foreach ($system in $ExternalSystems) {
        try {
            $response = Invoke-WebRequest -Uri $system.Url -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                return $true
            }
        } catch {
            # Continue checking other systems
        }
    }
    
    # Check if any of the system components are responding
    foreach ($component in $SystemComponents) {
        if ($component.Url) {
            try {
                $response = Invoke-WebRequest -Uri $component.Url -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
                if ($response.StatusCode -eq 200) {
                    return $true
                }
            } catch {
                # Continue checking other components
            }
        }
    }
    
    return $false
}

function Restart-System {
    Write-Heading -Text "Build System"
    Build-System

    Write-Heading -Text "Stop System"
    Stop-System

    Write-Heading -Text "Start System"
    Start-System

    Write-Heading -Text "Wait for System"
    Wait-ForServices
}

# Remember starting location
$InitialLocation = Get-Location

# Main execution
try {
    Write-Heading -Text "Testing Prerequisites"
    Test-Prerequisites

    if( $Restart) {
        Restart-System
    } 
    else {
        # Check if system is already running
        $systemRunning = Test-SystemRunning
        
        if ($systemRunning) {
            Write-Host "System is already running, skipping build and start steps" -ForegroundColor Yellow
        } else {
            Restart-System
        }
    }

    if (-not $SkipTests) {
        Write-Heading -Text "Test System"
        Test-System
    }

    Write-Heading -Text "DONE" -Color Green
} catch {
    Set-Location $WorkingDirectory
    Write-Host ""
    Write-Host "ERROR: $_" -ForegroundColor Red
    exit 1
}

# Restore location and exit with code 0 on success
Set-Location $WorkingDirectory
exit 0