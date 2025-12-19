@echo off
if not "%1"=="am_admin" (
    powershell -Command "Start-Process -FilePath '%0' -ArgumentList 'am_admin' -WindowStyle Hidden"
    exit /b
)

cd /d d:\student-portal\backend
start /B node server.js

timeout /t 2 /nobreak >nul

cd /d d:\student-portal\frontend
start /B npm start

exit
