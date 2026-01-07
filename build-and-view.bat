@echo off
echo Building PreTeXt book...
pretext build

if %errorlevel% neq 0 (
    echo Build failed!
    exit /b %errorlevel%
)

echo.
echo Copying custom STACK JS file...
copy /Y "assets\pretext\js\pretext-stack\stackapicalls.js" "output\web\_static\pretext\js\pretext-stack\stackapicalls.js" >nul

if %errorlevel% neq 0 (
    echo Failed to copy custom JS file!
    exit /b %errorlevel%
)

echo Custom stackapicalls.js deployed successfully!
echo.
echo Launching browser...
pretext view web
