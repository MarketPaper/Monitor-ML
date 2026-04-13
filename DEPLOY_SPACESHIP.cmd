@echo off
REM Lanzador de Deploy PowerShell para Monitor ML
REM Doble click para desplegar a Spaceship

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Deploy.ps1"
pause
