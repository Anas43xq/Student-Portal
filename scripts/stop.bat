@echo off
echo Stopping Student Portal servers...
echo.

echo Killing Node.js processes...
taskkill /F /IM node.exe >nul 2>&1

echo Killing npm processes...
taskkill /F /IM npm.cmd >nul 2>&1

echo.
echo All servers stopped!
echo.
