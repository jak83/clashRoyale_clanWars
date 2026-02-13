@echo off
echo ========================================
echo Setting up Robot Framework E2E Tests
echo ========================================
echo.

echo [1/3] Checking Python installation...
python --version > nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH!
    echo.
    echo Please install Python 3.8+ from https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation.
    echo.
    pause
    exit /b 1
)
python --version
echo.

echo [2/3] Creating Python virtual environment...
if exist "venv" (
    echo Virtual environment already exists. Skipping creation.
) else (
    python -m venv venv
    if errorlevel 1 (
        echo ERROR: Failed to create virtual environment!
        pause
        exit /b 1
    )
    echo Virtual environment created successfully!
)
echo.

echo [3/3] Installing Robot Framework and dependencies...
call venv\Scripts\activate.bat
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install dependencies!
    pause
    exit /b 1
)
echo.

echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo You can now run E2E tests:
echo   1. Start server: npm start
echo   2. In another terminal: npm run test:e2e
echo.
echo Or deploy with full testing: deploy.bat
echo.
pause
