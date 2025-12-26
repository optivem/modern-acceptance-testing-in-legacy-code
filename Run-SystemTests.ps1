param(
    [ValidateSet("local", "pipeline")]
    [string]$Mode = "local",

    [string]$TestId,

    [switch]$Rebuild,
    [switch]$Restart,
    [switch]$SkipTests,

    [int]$LogLines = 50,

    [string]$WorkingDirectory = (Get-Location).Path
)

# Constants
$TestConfigFileName = "Run-SystemTests.Config.ps1"
$ExternalModes = @("real", "stub")

# Load configuration - keyed by ExternalMode
$SystemConfig = @{
    "real" = @{
        # Docker Configuration - project name prefix
        ContainerName = "modern-acceptance-testing-real"

        # System Components (our application services)
        SystemComponents = @(
            @{ Name = "Frontend";
                Url = "http://localhost:3001";
                ContainerName = "frontend" }
            @{ Name = "Backend API";
                Url = "http://localhost:8081/health";
                ContainerName = "backend" }
        )

        # External Systems (third-party APIs)
        ExternalSystems = @(
            @{ Name = "ERP API (Real)";
                Url = "http://localhost:9001/erp/health";
                ContainerName = "external-real" }
            @{ Name = "Tax API (Real)";
                Url = "http://localhost:9001/tax/health";
                ContainerName = "external-real" }
        )
    }

    "stub" = @{
        # Docker Configuration - project name prefix
        ContainerName = "modern-acceptance-testing-stub"

        # System Components (our application services)
        SystemComponents = @(
            @{ Name = "Frontend";
                Url = "http://localhost:3002";
                ContainerName = "frontend" }
            @{ Name = "Backend API";
                Url = "http://localhost:8082/health";
                ContainerName = "backend" }
        )

        # External Systems (WireMock)
        ExternalSystems = @(
            @{ Name = "ERP API (Stub)";
                Url = "http://localhost:9002/erp/health";
                ContainerName = "external-stub" }
            @{ Name = "Tax API (Stub)";
                Url = "http://localhost:9002/tax/health";
                ContainerName = "external-stub" }
            @{ Name = "Clock API (Stub)";
                Url = "http://localhost:9002/clock/health";
                ContainerName = "external-stub" }
        )
    }
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
    $BuildCommands = $TestConfig.BuildCommands
    $Tests = $TestConfig.Tests
}

# Script Configuration
$ErrorActionPreference = "Continue"
$MaxAttempts = 30

# Variables set by Set-CurrentMode
$script:ComposeFile = $null
$script:ContainerName = $null
$script:SystemComponents = $null
$script:ExternalSystems = $null

function Set-CurrentMode {
    param([string]$ExternalMode)
    
    $script:ComposeFile = "docker-compose.$Mode.$ExternalMode.yml"
    
    $modeConfig = $SystemConfig[$ExternalMode]
    $script:ContainerName = $modeConfig.ContainerName
    $script:SystemComponents = $modeConfig.SystemComponents
    $script:ExternalSystems = $modeConfig.ExternalSystems
}

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

        # Execute command with real-time output streaming
        Invoke-Expression $Command
        $exitCode = $LASTEXITCODE

        if ($exitCode -ne 0 -and $null -ne $exitCode) {
            Write-Host ""
            Write-Host "Working directory: $(Get-Location)" -ForegroundColor Red
            Write-Host "Command: $Command" -ForegroundColor Red
            Write-Host "Command failed with exit code: $exitCode" -ForegroundColor Red
            throw "Failed to execute command: $Command (Exit Code: $exitCode)"
        }

    } finally {
        if ($Path) {
            Set-Location $OriginalLocation
        }
    }
}

function Test-PowerShellVersion {
    $psVersion = $PSVersionTable.PSVersion
    
    if ($psVersion.Major -lt 5) {
        Write-Host "[✗] PowerShell 5+ required. Found: $($psVersion.Major).$($psVersion.Minor)" -ForegroundColor Red
        Write-Host "    Download: https://github.com/PowerShell/PowerShell" -ForegroundColor Yellow
        throw "PowerShell 5+ is required"
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

function Stop-System {
    Execute-Command -Command "docker compose -f $ComposeFile down 2>`$null"

    # Stop containers by project name
    $Containers = docker ps -aq --filter "name=$ContainerName" 2>$null
    
    if ($Containers) {
        Execute-Command -Command "docker stop $Containers 2>`$null"
        Execute-Command -Command "docker rm -f $Containers 2>`$null"
    }

    # Wait to ensure containers are fully stopped and ports are released
    Start-Sleep -Seconds 2
}

function Start-System {
    param(
        [switch]$ForceBuild
    )

    if ($ForceBuild) {
        Write-Host "Force rebuilding images with no cache..." -ForegroundColor Yellow
        Execute-Command -Command "docker compose -f $ComposeFile build --no-cache"
    }

    Execute-Command -Command "docker compose -f $ComposeFile up -d"

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

function Execute-BuildCommands {
    Write-Host "Executing build commands..." -ForegroundColor Yellow
    
    foreach ($buildCommand in $BuildCommands) {
        $buildName = $buildCommand.Name
        $command = $buildCommand.Command
        
        Write-Host ""
        Write-Host "Executing: $buildName" -ForegroundColor Cyan
        
        Execute-Command -Command $command -Path $WorkingDirectory
    }
    
    Write-Host ""
    Write-Host "All build commands completed successfully!" -ForegroundColor Green
}

function Test-System-Selected {
    param(
        [hashtable]$Test
    )

    $TestName = $Test.Name
    $TestCommand = $Test.Command
    $TestPath = Join-Path $WorkingDirectory $Test.Path
    $TestReportPath = Join-Path $WorkingDirectory $Test.TestReportPath
    $TestInstallCommands = $Test.TestInstallCommands

    Write-Host "Running $TestName..." -ForegroundColor Cyan

    # Install test dependencies if specified
    if ($null -ne $TestInstallCommands) {
        foreach ($installCommand in $TestInstallCommands) {
            Write-Host "Installing test dependencies: $installCommand" -ForegroundColor Cyan
            Execute-Command -Command $installCommand -Path $TestPath
        }
    }

    try 
    {
        Execute-Command -Command $TestCommand -Path $TestPath

        Write-Host ""
        Write-Host "All $TestName passed!" -ForegroundColor Green
    } catch {
        Write-Host ""
        Write-Host "Some $TestName failed." -ForegroundColor Red
        Write-Host "Test report: $TestReportPath"
        throw
    }
}

function Test-System {
    $testsToRun = $Tests

    # Filter by TestId if specified
    if ($TestId) {
        $testsToRun = $Tests | Where-Object { $_.Id -eq $TestId }
        if (-not $testsToRun) {
            $availableIds = ($Tests | ForEach-Object { $_.Id }) -join ", "
            throw "Test with ID '$TestId' not found. Available IDs: $availableIds"
        }
    }

    foreach ($test in $testsToRun) {
        Test-System-Selected -Test $test
    }
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
    param(
        [switch]$ForceBuild
    )

    Write-Heading -Text "Stop System"
    Stop-System

    Write-Heading -Text "Start System"
    Start-System -ForceBuild:$ForceBuild

    Write-Heading -Text "Wait for System"
    Wait-ForServices
}

# Remember starting location
$InitialLocation = Get-Location

# Main execution
try {
    Write-Heading -Text "Testing Prerequisites"
    Test-Prerequisites

    if (-not $SkipTests) {
        Write-Heading -Text "Build"
        Execute-BuildCommands
    }

    # Start/restart systems for each mode
    foreach ($externalMode in $ExternalModes) {
        Set-CurrentMode -ExternalMode $externalMode
        Write-Heading -Text "System: $($externalMode.ToUpper())"

        if($Rebuild) {
            Restart-System -ForceBuild
        }
        elseif($Restart) {
            Restart-System
        } 
        else {
            # Check if system is already running
            $systemRunning = Test-SystemRunning
            
            if ($systemRunning) {
                Write-Host "System is already running, skipping restart" -ForegroundColor Yellow
            } else {
                Restart-System
            }
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