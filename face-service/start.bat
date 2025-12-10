@echo off
echo ========================================
echo VotEth Face Verification Service
echo ========================================
echo.

cd /d "%~dp0"

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
    echo.
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Check if dependencies are installed
if not exist "venv\Lib\site-packages\fastapi" (
    echo Installing dependencies (first time setup)...
    echo This may take a few minutes...
    pip install --upgrade pip
    pip install -r requirements.txt
    echo.
)

echo.
echo Starting Face Verification Service...
echo Server will be available at: http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

python main.py

pause
