@echo off
echo ========================================
echo Local Deployment Script
echo ========================================
echo.

REM Step 1: Kill any running Node/npm processes
echo [1/3] Stopping existing Node processes...
taskkill /F /IM node.exe >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo    ✓ Node processes stopped
) else (
    echo    - No Node processes were running
)
echo.

REM Step 2: Run tests
echo [2/3] Running tests...
call npm test
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ TESTS FAILED!
    echo    Fix the errors above before starting the server.
    echo.
    pause
    exit /b 1
)
echo    ✓ All tests passed
echo.

REM Step 3: Start the server
echo [3/3] Starting server...
echo    Press Ctrl+C to stop the server
echo.
echo ========================================
echo ✓ Tests passed - Starting server now
echo ========================================
echo.
npm start
