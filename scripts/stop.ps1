# Stop Student Portal Servers
Write-Host "Stopping Student Portal servers..." -ForegroundColor Red
Write-Host ""

Write-Host "Killing Node.js processes..." -ForegroundColor Yellow
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue

Write-Host "Killing npm processes..." -ForegroundColor Yellow
Stop-Process -Name "npm" -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "All servers stopped!" -ForegroundColor Green
Write-Host ""
