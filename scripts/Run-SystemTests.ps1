param(
    [Parameter(Position=0)]
    [ValidateSet("local", "pipeline")]
    [string]$Mode = "local",

    [switch]$TestOnly,

    [int]$LogLines = 50,

    [string]$WorkingDirectory = $null
)


# Load configuration
$SystemConfig = @{
    # Docker Configuration
    ContainerName = "modern-acceptance-testing-in-legacy-code"

    # System Components (our application services)
    SystemComponents = @(
        @{ Name = "Frontend";
            Url = "http://localhost:3001";
            ContainerName = "frontend";
            GitRepo = "https://github.com/optivem/modern-acceptance-testing-in-legacy-code-frontend.git";
            RepoPath = "..\modern-acceptance-testing-in-legacy-code-frontend";
            BuildPath = "..\modern-acceptance-testing-in-legacy-code-frontend\frontend";
            InstallCommand = "npm install";
            BuildCommand = "npm run build" }
        @{ Name = "Backend API";
            Url = "http://localhost:8081/health";
            ContainerName = "backend";
            GitRepo = "https://github.com/optivem/modern-acceptance-testing-in-legacy-code-backend.git";
            RepoPath = "..\modern-acceptance-testing-in-legacy-code-backend";
            BuildPath = "..\modern-acceptance-testing-in-legacy-code-backend\backend";
            InstallCommand = $null;
            BuildCommand = "& .\gradlew.bat clean build" }
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

$TestConfig = . .\Run-SystemTests.TestConfig.ps1

# Script Configuration
$ErrorActionPreference = "Continue"
$MaxAttempts = 10
$ComposeFile = if ($Mode -eq "pipeline") { "docker-compose.pipeline.yml" } else { "docker-compose.local.yml" }

# Extract configuration values
$ContainerName = $SystemConfig.ContainerName

# Extract component arrays
$SystemComponents = $SystemConfig.SystemComponents
$ExternalSystems = $SystemConfig.ExternalSystems

$TestCommand = $TestConfig.TestCommand
$TestReportPath = $TestConfig.TestReportPath

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
        Wait-ForService -Url $component.Url -ServiceName $component.Name -ContainerName $component.ContainerName
    }

    Write-Host ""
    Write-Host "All services are ready!" -ForegroundColor Green
}

function Clone-Repositories {
    foreach ($component in $SystemComponents) {
        if ($component.GitRepo) {
            # Use provided WorkingDirectory or current location for path resolution
            $baseDir = if ($WorkingDirectory) { $WorkingDirectory } else { Get-Location }
            $repoPath = Join-Path $baseDir $component.RepoPath
            $repoPath = [System.IO.Path]::GetFullPath($repoPath)
            
            if (Test-Path $repoPath) {
                Write-Host "Repository already exists: $($component.Name) at $repoPath" -ForegroundColor Yellow
            } else {
                Write-Host "Cloning $($component.Name) from $($component.GitRepo)..." -ForegroundColor Cyan
                $parentPath = Split-Path $repoPath -Parent
                
                if (-not (Test-Path $parentPath)) {
                    New-Item -ItemType Directory -Path $parentPath -Force | Out-Null
                }
                
                Execute-Command -Command "git clone $($component.GitRepo) `"$repoPath`""
                Write-Host "Successfully cloned $($component.Name)" -ForegroundColor Green
            }
        }
    }
}

function Install-Dependencies {
    foreach ($component in $SystemComponents) {
        if ($component.InstallCommand) {
            Write-Host "Installing dependencies for $($component.Name)..." -ForegroundColor Cyan
            Execute-Command -Command $component.InstallCommand -Path $component.BuildPath
            Write-Host "Dependencies installed for $($component.Name)" -ForegroundColor Green
        }
    }
}



function Build-System {
    if ($Mode -eq "local") {
        foreach ($component in $SystemComponents) {
            Write-Host "Building $($component.Name)..." -ForegroundColor Cyan
            Execute-Command -Command $component.BuildCommand -Path $component.BuildPath
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

function Test-System {
    Execute-Command -Command $TestCommand -Path "system-test"

    Write-Host ""
    Write-Host "All tests passed!" -ForegroundColor Green
    Write-Host "Test report: " -NoNewline
    Write-Host $TestReportPath -ForegroundColor Yellow
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

# Remember starting location
$InitialLocation = Get-Location

# Main execution
try {

    if (-not $TestOnly) {
        Write-Heading -Text "Clone Repositories"
        Clone-Repositories

        Write-Heading -Text "Install Dependencies"
        Install-Dependencies

        Write-Heading -Text "Build System"
        Build-System

        Write-Heading -Text "Stop System"
        Stop-System

        Write-Heading -Text "Start System"
        Start-System

        Write-Heading -Text "Wait for System"
        Wait-ForServices
    }

    Write-Heading -Text "Test System"
    Test-System

    Write-Heading -Text "DONE" -Color Green
} catch {
    Write-Host ""
    Write-Host "ERROR: $_" -ForegroundColor Red
    Set-Location $InitialLocation
    exit 1
}

# Restore location and exit with code 0 on success
Set-Location $InitialLocation
exit 0