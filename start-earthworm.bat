@echo off
rem One-click start for the local Earthworm deployment (no Docker, no login)
cd /d "%~dp0"

echo [1/2] Starting Earthworm API (Node, port 3001) ...
start "earthworm-api" cmd /k "cd /d %~dp0apps\api && node dist\src\main.js"

echo [2/2] Starting Earthworm Client (Node, port 3000) ...
start "earthworm-client" cmd /k "cd /d %~dp0apps\client && node .output\server\index.mjs"

echo.
echo All services started:
echo   - Web:      http://localhost:3000
echo   - API:      http://localhost:3001
echo   - Swagger:  http://localhost:3001/swagger
echo.
echo To stop everything, run stop-earthworm.bat
timeout /t 5 >nul