@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0installer\start.ps1"
if errorlevel 1 (
  pause
  exit /b 1
)
start "" "http://127.0.0.1:5180/home"
