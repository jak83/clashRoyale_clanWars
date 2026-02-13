@echo off
echo ========================================
echo Deploying Clash Wars Tracker
echo ========================================
echo.

REM Check if venv exists
if not exist "venv\Scripts\activate.bat" (
    echo ERROR: Python virtual environment not found!
    echo.
    echo Please run setup first:
    echo   python -m venv venv
    echo   venv\Scripts\activate
    echo   pip install -r requirements.txt
    echo.
    pause
    exit /b 1
)

echo [1/6] Starting local server for testing...
start /B cmd /c "npm start > server.log 2>&1"
set SERVER_PID=%ERRORLEVEL%

REM Wait for server to start (5 seconds)
echo Waiting for server to start...
timeout /t 5 /nobreak > nul

REM Check if server is running
curl -s http://localhost:3000 > nul 2>&1
if errorlevel 1 (
    echo.
    echo ========================================
    echo ERROR: Server failed to start!
    echo ========================================
    echo Check server.log for details.
    echo.
    pause
    exit /b 1
)
echo Server started successfully!
echo.

echo [2/6] Running unit tests...
call npm test
if errorlevel 1 (
    echo.
    echo ========================================
    echo ERROR: Unit tests failed!
    echo ========================================
    echo.
    echo Deployment aborted. Fix failing tests before deploying.
    echo Stopping local server...
    taskkill /F /FI "WINDOWTITLE eq npm start*" > nul 2>&1
    taskkill /F /FI "IMAGENAME eq node.exe" /FI "MEMUSAGE gt 10000" > nul 2>&1
    echo.
    pause
    exit /b 1
)
echo.

echo [3/6] Running E2E tests with Robot Framework...
call venv\Scripts\activate.bat && robot --outputdir tests/e2e/results tests/e2e
if errorlevel 1 (
    echo.
    echo ========================================
    echo ERROR: E2E tests failed!
    echo ========================================
    echo.
    echo See tests/e2e/results/report.html for details.
    echo Deployment aborted. Fix failing tests before deploying.
    echo.
    echo Stopping local server...
    taskkill /F /FI "WINDOWTITLE eq npm start*" > nul 2>&1
    taskkill /F /FI "IMAGENAME eq node.exe" /FI "MEMUSAGE gt 10000" > nul 2>&1
    echo.
    pause
    exit /b 1
)
echo.

echo Stopping local server...
taskkill /F /FI "WINDOWTITLE eq npm start*" > nul 2>&1
taskkill /F /FI "IMAGENAME eq node.exe" /FI "MEMUSAGE gt 10000" > nul 2>&1
timeout /t 2 /nobreak > nul
echo.

echo All tests passed! Proceeding with deployment...
echo.

echo [4/6] Pushing to GitHub...
git push origin main
if errorlevel 1 (
    echo ERROR: Git push failed!
    pause
    exit /b 1
)
echo.

echo [5/6] Deploying to Oracle Cloud server...
ssh -i "C:\Users\JaniAhlgren\.ssh\oracle-vm.key" ubuntu@129.151.219.17 "cd clashApi && git pull && npm install && pm2 restart clash-wars"
if errorlevel 1 (
    echo ERROR: Deployment failed!
    pause
    exit /b 1
)
echo.

echo [6/6] Checking server status...
ssh -i "C:\Users\JaniAhlgren\.ssh\oracle-vm.key" ubuntu@129.151.219.17 "pm2 list"
echo.

echo ========================================
echo Deployment Complete!
echo ========================================
echo.
echo Check your app at the Cloudflare Tunnel URL
echo To get current URL: pm2 logs tunnel --lines 20
echo.
pause
