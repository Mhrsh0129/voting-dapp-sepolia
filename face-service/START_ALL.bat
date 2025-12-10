@echo off
REM ============================================
REM VotEth Face Verification System - Startup
REM ============================================

setlocal enabledelayedexpansion

REM Get the directory where this script is located
cd /d "%~dp0"

REM Check if Python virtual environment exists
if not exist "venv313" (
    echo ERROR: Python virtual environment not found!
    echo Please run: python -m venv venv313
    pause
    exit /b 1
)

REM Kill any existing Python processes on ports 8000 and 8080
echo Cleaning up existing processes...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000') do taskkill /pid %%a /f 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8080') do taskkill /pid %%a /f 2>nul

REM Wait for ports to clear
timeout /t 2 /nobreak

REM Start Face Service on port 8000
echo.
echo ========================================
echo Starting Face Verification Service...
echo ========================================
start "Face Service" cmd /k "venv313\Scripts\python.exe main.py"

REM Wait for Face Service to start
timeout /t 5 /nobreak

REM Start HTTP Server on port 8080 for enrollment page
echo.
echo ========================================
echo Starting HTTP Server...
echo ========================================
start "HTTP Server - Enrollment" cmd /k "python -m http.server 8080"

REM Open enrollment page in browser
echo.
echo ========================================
echo Opening Enrollment Page...
echo ========================================
timeout /t 2 /nobreak
start "" "http://localhost:8080/enroll.html"

REM Display status
echo.
echo ========================================
echo VotEth Face Verification System STARTED
echo ========================================
echo.
echo Services Running:
echo   - Face Service API:     http://localhost:8000
echo   - API Documentation:    http://localhost:8000/docs
echo   - Enrollment Page:      http://localhost:8080/enroll.html
echo   - HTTP Server:          http://localhost:8080
echo.
echo IMPORTANT:
echo   - Keep both console windows open!
echo   - Face Service: port 8000
echo   - HTTP Server: port 8080
echo.
echo Ready to start enrolling faces!
echo.
pause
