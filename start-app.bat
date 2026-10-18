@echo off
title DayFlow - Personal Productivity & Time-Blocking Suite
echo ========================================================
echo   Starting DayFlow Development Server...
echo   Opening http://localhost:5173 in your browser...
echo   Keep this window open while using the app.
echo ========================================================
cd /d "%~dp0"
start "" "http://localhost:5173"
call npm.cmd run dev
pause
