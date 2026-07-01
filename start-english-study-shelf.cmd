@echo off
setlocal

cd /d "%~dp0"
title EnglishStudyShelf

echo.
echo EnglishStudyShelf local launcher / 本地启动器
echo --------------------------------

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found. Please install Node.js first.
  echo 未找到 Node.js，请先安装 Node.js。
  echo https://nodejs.org/
  pause
  exit /b 1
)

where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo npm.cmd was not found. Please reinstall Node.js.
  echo 未找到 npm.cmd，请重新安装 Node.js。
  pause
  exit /b 1
)

if not exist ".env" (
  if exist ".env.example" (
    copy /Y ".env.example" ".env" >nul
    echo Created local .env from .env.example.
    echo 已从 .env.example 创建本地 .env。
  )
)

if not exist "node_modules" (
  echo Installing dependencies. This may take a few minutes the first time.
  echo 正在安装依赖，首次运行可能需要几分钟。
  call npm.cmd install
  if errorlevel 1 (
    echo Dependency installation failed.
    echo 依赖安装失败。
    pause
    exit /b 1
  )
)

echo.
echo Starting local app...
echo 正在启动本地应用...
echo Leave this window open while using EnglishStudyShelf.
echo 使用时请保持这个窗口打开。
echo Close this window to stop the local app.
echo 关闭这个窗口会停止本地应用。
echo.

call npm.cmd run dev

echo.
echo EnglishStudyShelf stopped.
echo EnglishStudyShelf 已停止。
pause
