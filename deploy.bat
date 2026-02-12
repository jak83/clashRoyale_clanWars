@echo off
echo ========================================
echo Deploying Clash Wars Tracker
echo ========================================
echo.

echo [1/4] Running tests...
call npm test
if errorlevel 1 (
    echo.
    echo ========================================
    echo ERROR: Tests failed!
    echo ========================================
    echo.
    echo Deployment aborted. Fix failing tests before deploying.
    echo.
    pause
    exit /b 1
)
echo.
echo All tests passed! Proceeding with deployment...
echo.

echo [2/4] Pushing to GitHub...
git push origin main
if errorlevel 1 (
    echo ERROR: Git push failed!
    pause
    exit /b 1
)
echo.

echo [3/4] Deploying to Oracle Cloud server...
ssh -i "C:\Users\JaniAhlgren\.ssh\oracle-vm.key" ubuntu@129.151.219.17 "cd clashApi && git pull && npm install && pm2 restart clash-wars"
if errorlevel 1 (
    echo ERROR: Deployment failed!
    pause
    exit /b 1
)
echo.

echo [4/4] Checking server status...
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
