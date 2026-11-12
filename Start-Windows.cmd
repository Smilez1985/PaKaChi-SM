@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Bitte zuerst Node.js 24 LTS installieren und danach erneut starten.
  pause
  exit /b 1
)
node scripts\ensure-dependencies.mjs
if errorlevel 1 (
  echo Abhaengigkeitsinstallation fehlgeschlagen.
  pause
  exit /b 1
)
call npm run local -- --open
pause
