@echo off
REM Double-click this file to start The Design Factory demo (Windows).
cd /d "%~dp0"

echo ============================================
echo   The Design Factory - starting the demo
echo ============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js isn't installed yet.
  echo Please install it from https://nodejs.org (the green LTS button^),
  echo then double-click this file again.
  echo.
  pause
  exit /b 1
)

if not exist node_modules (
  echo First-time setup - installing (this takes a few minutes)...
  call npm install || (echo Install failed. & pause & exit /b 1)
)

call npm run demo
echo The site has stopped.
pause
