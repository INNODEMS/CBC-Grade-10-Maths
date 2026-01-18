@echo off
echo Building PreTeXt book...
pretext build

if %errorlevel% neq 0 (
    echo Build failed!
    exit /b %errorlevel%
)

@REM echo.
@REM echo Copying custom STACK JS file...
@REM copy /Y "assets\pretext\js\pretext-stack\stackapicalls.js" "output\web\_static\pretext\js\pretext-stack\stackapicalls.js" >nul

@REM if %errorlevel% neq 0 (
@REM     echo Failed to copy custom JS file!
@REM     exit /b %errorlevel%
@REM )

@REM echo Custom stackapicalls.js deployed successfully!
@REM echo.

echo Launching browser...
pretext view web
