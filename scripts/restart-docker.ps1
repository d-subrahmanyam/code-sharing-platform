# Docker Restart Script - PowerShell Version
# Purpose: Restart Docker containers with detailed logging
# Author: Code Sharing Platform Team
# Date: 2025-12-16
# Usage: .\restart-docker.ps1

param(
    [switch]$NoLogs = $false
)

# Get script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$LogFile = Join-Path $ProjectRoot "docker-restart.log"

# Color codes
$Colors = @{
    'Info'    = 'Cyan'
    'Success' = 'Green'
    'Warning' = 'Yellow'
    'Error'   = 'Red'
}

# Logging functions
function Write-Log {
    param(
        [Parameter(Mandatory=$true)]
        [string]$Message,
        [Parameter(Mandatory=$true)]
        [ValidateSet('Info', 'Success', 'Warning', 'Error')]
        [string]$Level
    )
    
    $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $logEntry = "[$timestamp] [$Level] $Message"
    
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] [$Level] $Message" -ForegroundColor $Colors[$Level]
    
    if (-not $NoLogs) {
        Add-Content -Path $LogFile -Value $logEntry
    }
}

function Write-Header {
    param([string]$Title)
    Write-Host ""
    Write-Host "================================" -ForegroundColor Cyan
    Write-Host $Title -ForegroundColor Cyan
    Write-Host "================================" -ForegroundColor Cyan
    Write-Host ""
}

# Main script
Clear-Host
Write-Header "Docker Restart Script"

Write-Log "Starting Docker restart sequence..." Info
Write-Log "Working directory: $ProjectRoot" Info
Write-Log "PowerShell version: $($PSVersionTable.PSVersion)" Info
Write-Log "Log file: $LogFile" Info

# Change to project directory
Set-Location $ProjectRoot

try {
    # Step 1: Stop containers
    Write-Log "Step 1: Stopping Docker containers..." Info
    docker-compose down | Out-String | ForEach-Object { Write-Log $_ Info }
    Write-Log "Containers stopped successfully" Success
    
    # Step 2: Wait for graceful shutdown
    Write-Log "Step 2: Waiting for graceful shutdown (3 seconds)..." Info
    Start-Sleep -Seconds 3
    Write-Log "Shutdown complete" Success
    
    # Step 3: Start containers
    Write-Log "Step 3: Starting Docker containers..." Info
    docker-compose up -d | Out-String | ForEach-Object { Write-Log $_ Info }
    Write-Log "Containers started successfully" Success
    
    # Step 4: Wait for services to be ready
    Write-Log "Step 4: Waiting for services to initialize (10 seconds)..." Info
    Start-Sleep -Seconds 10
    Write-Log "Services should be ready" Success
    
    # Step 5: Check container status
    Write-Log "Step 5: Checking container status..." Info
    Write-Host ""
    docker-compose ps | Tee-Object -FilePath $LogFile -Append | Write-Host
    Write-Host ""
    
    # Step 6: Verify services
    Write-Log "Step 6: Verifying service health..." Info
    
    # Check frontend
    try {
        $frontendCheck = Invoke-WebRequest -Uri "http://localhost:80" -Method Head -TimeoutSec 5 -ErrorAction SilentlyContinue
        if ($frontendCheck.StatusCode -eq 200) {
            Write-Log "Frontend (Nginx) is healthy - http://localhost:80" Success
        } else {
            Write-Log "Frontend responded with status: $($frontendCheck.StatusCode)" Warning
        }
    } catch {
        Write-Log "Frontend health check in progress (services may still be starting)" Warning
    }
    
    # Check backend
    try {
        $backendCheck = Invoke-WebRequest -Uri "http://localhost:8080/graphql" -Method Head -TimeoutSec 5 -ErrorAction SilentlyContinue
        if ($backendCheck.StatusCode -eq 200) {
            Write-Log "Backend (Spring Boot) is healthy - http://localhost:8080" Success
        } else {
            Write-Log "Backend responded with status: $($backendCheck.StatusCode)" Warning
        }
    } catch {
        Write-Log "Backend health check in progress or service not ready yet" Warning
    }
    
    Write-Header "Docker restart completed!"
    Write-Log "All services are running. Check the application at:" Success
    Write-Log "  Frontend: http://localhost" Info
    Write-Log "  Backend API: http://localhost:8080" Info
    Write-Log "  Backend GraphQL: http://localhost:8080/graphql" Info
    Write-Log "Logs saved to: $LogFile" Info
    
} catch {
    Write-Log "Error during restart: $_" Error
    exit 1
}
