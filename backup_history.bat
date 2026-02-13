@echo off
REM Backup script for Windows (local development)
REM Backs up history data to user's home directory

echo ========================================
echo Clash Wars History Backup (Windows)
echo ========================================
echo.

set TIMESTAMP=%date:~-4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set BACKUP_DIR=%USERPROFILE%\clash-history-backups
set PROJECT_DIR=%~dp0

REM Create backup directory
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

echo Timestamp: %TIMESTAMP%
echo Backup location: %BACKUP_DIR%
echo.

REM Check if history data exists
if not exist "ongoing" if not exist "history" (
    echo ERROR: No history data found
    pause
    exit /b 1
)

REM Create backup using tar (Windows 10+ has built-in tar)
set BACKUP_FILE=%BACKUP_DIR%\clash-history-%TIMESTAMP%.zip
echo Creating backup: %BACKUP_FILE%
echo.

tar -czf "%BACKUP_FILE%" ongoing history 2>nul

if %errorlevel% equ 0 (
    echo [SUCCESS] Backup created successfully
) else (
    echo [ERROR] Backup failed
    pause
    exit /b 1
)

REM Show backup summary
echo.
echo ========================================
echo Backup Summary:
dir /b "%BACKUP_DIR%\clash-history-*.zip" 2>nul | find /c /v ""
echo backups found in %BACKUP_DIR%
echo ========================================
echo.
