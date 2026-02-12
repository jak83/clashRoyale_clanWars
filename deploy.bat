@echo off
echo ========================================
echo Deploying Clash Wars Tracker
echo ========================================
echo.

echo [1/3] Pushing to GitHub...
git push origin main
if errorlevel 1 (
    echo ERROR: Git push failed!
    pause
    exit /b 1
)
echo.

echo [2/3] Deploying to Oracle Cloud server...
ssh -i "C:\Users\JaniAhlgren\.ssh\oracle-vm.key" ubuntu@129.151.219.17 "cd clashApi && git pull && npm install && pm2 restart clash-wars"
if errorlevel 1 (
    echo ERROR: Deployment failed!
    pause
    exit /b 1
)
echo.

echo [3/3] Checking server status...
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
