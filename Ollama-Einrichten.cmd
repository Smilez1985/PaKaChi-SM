@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Bitte zuerst Node.js ab Version 24 installieren.
  pause
  exit /b 1
)
node scripts/setup-ollama.mjs %*
pause
