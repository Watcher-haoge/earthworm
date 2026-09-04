@echo off
rem One-click stop for the local Earthworm deployment
echo Stopping Earthworm service windows ...
taskkill /FI "WINDOWTITLE eq earthworm-api*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq earthworm-client*" /T /F >nul 2>&1

echo Killing processes listening on ports 3000 / 3001 ...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000 :3001" ^| findstr LISTENING') do (
  taskkill /F /PID %%a >nul 2>&1
)

echo Done. Earthworm services stopped.