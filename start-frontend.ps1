Write-Host "Starting Demon Slayer Corps Project Management System..." -ForegroundColor Green
Write-Host ""

Set-Location "c:\Users\micmi\Documents\GitHub\3100\frontend"

Write-Host "Installing dependencies if needed..." -ForegroundColor Yellow
npm install

Write-Host ""
Write-Host "Starting development server..." -ForegroundColor Yellow
Write-Host "The application will be available at http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Red
Write-Host ""

npm run dev