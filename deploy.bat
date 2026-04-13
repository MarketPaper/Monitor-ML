@echo off
REM Script de deploy a Spaceship vía FTP para Windows
REM Uso: doble click o deploy.bat en cmd

setlocal enabledelayedexpansion

echo.
echo === DEPLOY A SPACESHIP ===
echo.

REM Variables
set FTP_HOST=mlibretools.aigents.com.ar
set FTP_USER=ftplay@mlibretools.aigents.com.ar
set FTP_PASS=7948.TresSeis
set FTP_PATH=/home/jmyqoqyfsb/mlibretools.aigents.com.ar/
set LOCAL_PATH=src

REM Crear archivo temporal con comandos FTP
set TEMP_FTP=%TEMP%\ftp_commands.txt
(
    echo open %FTP_HOST%
    echo %FTP_USER%
    echo %FTP_PASS%
    echo cd %FTP_PATH%
    echo lcd %LOCAL_PATH%
    echo mput *
    echo quit
) > %TEMP_FTP%

echo Conectando a %FTP_HOST%...
ftp -s:%TEMP_FTP%

if %errorlevel% equ 0 (
    echo.
    echo [OK] Deploy completado exitosamente!
    echo Sitio: http://mlibretools.aigents.com.ar/
) else (
    echo.
    echo [ERROR] Hubo un problema en el deploy
)

REM Limpiar archivo temporal
del %TEMP_FTP%

pause
