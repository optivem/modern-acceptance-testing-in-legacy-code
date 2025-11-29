param(
    [Parameter(Position=0)]
    [ValidateSet("local", "pipeline")]
    [string]$Mode = "local",

    [switch]$TestOnly,

    [int]$LogLines = 50
)

Remove-Variable -Name 'ProgressPreference' -ErrorAction SilentlyContinue

$WorkingDirectory = Get-Location

# Repository configuration
$RepoOwner = "optivem"
$RepoName = "modern-acceptance-testing-in-legacy-code"
$RepoUrl = "https://github.com/$RepoOwner/$RepoName.git"
$RepoPath = Join-Path (Get-Location) "..\$RepoName"
$ScriptPath = Join-Path $RepoPath "Run-SystemTests.ps1"

# Clone or pull the repository
if (Test-Path $RepoPath) {
    Write-Host "Repository already exists. Pulling latest changes..." -ForegroundColor Cyan
    Push-Location $RepoPath
    try {
        git pull
        Write-Host "Repository updated." -ForegroundColor Green
    }
    finally {
        Pop-Location
    }
}
else {
    Write-Host "Cloning repository from: $RepoUrl" -ForegroundColor Cyan
    git clone $RepoUrl $RepoPath
    Write-Host "Repository cloned." -ForegroundColor Green
}

# Verify script exists
if (-not (Test-Path $ScriptPath)) {
    Write-Host "Error: Script not found at $ScriptPath" -ForegroundColor Red
    exit 1
}

Write-Host "Executing script from repository..." -ForegroundColor Cyan
Set-Location "$RepoPath"
& $ScriptPath -Mode $Mode -TestOnly:$TestOnly -LogLines $LogLines -WorkingDirectory $WorkingDirectory

if ($LASTEXITCODE -ne 0) {
    Write-Host "Script execution failed with exit code: $LASTEXITCODE" -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "Done!" -ForegroundColor Green
