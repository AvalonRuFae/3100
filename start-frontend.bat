@echo off
echo Starting Demon Slayer Corps Project Management System...
echo.

cd /d "c:\Users\micmi\Documents\GitHub\3100\frontend"

echo Installing dependencies if needed...
call npm install

echo.
echo Starting development server...
echo The application will be available at http://localhost:5173
echo.
echo Press Ctrl+C to stop the server
echo.

call npm run dev

pause