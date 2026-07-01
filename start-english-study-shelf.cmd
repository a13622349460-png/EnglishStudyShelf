@echo off
setlocal

cd /d "%~dp0"
title EnglishStudyShelf

echo.
echo EnglishStudyShelf local launcher
echo --------------------------------

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found. Please install Node.js first.
  echo https://nodejs.org/
  pause
  exit /b 1
)

where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo npm.cmd was not found. Please reinstall Node.js.
  pause
  exit /b 1
)

if not exist ".env" (
  if exist ".env.example" (
    copy /Y ".env.example" ".env" >nul
    echo Created local .env from .env.example.
  )
)

if not exist "node_modules" (
  echo Installing dependencies. This may take a few minutes the first time.
  call npm.cmd install
  if errorlevel 1 (
    echo Dependency installation failed.
    pause
    exit /b 1
  )
)

echo.
echo Starting local app...
echo Leave this window open while using EnglishStudyShelf.
echo Close this window to stop the local app.
echo.

call npm.cmd run dev

echo.
echo EnglishStudyShelf stopped.
pause

