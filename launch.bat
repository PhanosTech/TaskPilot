
@echo off
REM Change directory to the location of this script to ensure project files are found
cd /d "%~dp0"

echo Starting TaskPilot Server...
npm run start
pause
