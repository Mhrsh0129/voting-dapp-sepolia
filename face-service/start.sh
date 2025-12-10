#!/bin/bash
# VotEth Face Verification Service - Start Script

echo "========================================"
echo "VotEth Face Verification Service"
echo "========================================"
echo

cd "$(dirname "$0")"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    echo
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Check if dependencies are installed
if [ ! -d "venv/lib/python*/site-packages/fastapi" ]; then
    echo "Installing dependencies (first time setup)..."
    echo "This may take a few minutes..."
    pip install --upgrade pip
    pip install -r requirements.txt
    echo
fi

echo
echo "Starting Face Verification Service..."
echo "Server will be available at: http://localhost:8000"
echo "API Docs: http://localhost:8000/docs"
echo
echo "Press Ctrl+C to stop the server"
echo "========================================"
echo

python main.py
