# VotEth Face Verification Service - PowerShell Start Script

Write-Host "========================================"
Write-Host "VotEth Face Verification Service" -ForegroundColor Yellow
Write-Host "========================================"
Write-Host ""

Set-Location $PSScriptRoot

# Check if virtual environment exists
if (-not (Test-Path "venv")) {
    Write-Host "Creating virtual environment..." -ForegroundColor Cyan
    python -m venv venv
    Write-Host ""
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Cyan
& .\venv\Scripts\Activate.ps1

# Check if dependencies are installed
if (-not (Test-Path "venv\Lib\site-packages\fastapi")) {
    Write-Host "Installing dependencies (first time setup)..." -ForegroundColor Yellow
    Write-Host "This may take a few minutes..."
    pip install --upgrade pip
    pip install -r requirements.txt
    Write-Host ""
}

Write-Host ""
Write-Host "Starting Face Verification Service..." -ForegroundColor Green
Write-Host "Server will be available at: http://localhost:8000" -ForegroundColor White
Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop the server"
Write-Host "========================================"
Write-Host ""

python main.py
