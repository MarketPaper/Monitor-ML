@echo off
REM Deploy Monitor ML a Spaceship - Metodo alternativo con timeout y reintentos
REM Uso: Doble click en este archivo

setlocal enabledelayedexpansion

echo.
echo ========================================
echo   DEPLOY MONITOR ML A SPACESHIP
echo ========================================
echo.

REM Configuracion
set FTP_HOST=mlibretools.aigents.com.ar
set FTP_USER=ftplay@mlibretools.aigents.com.ar
set FTP_PASS=7948.TresSeis
set FTP_PATH=/home/jmyqoqyfsb/mlibretools.aigents.com.ar
set LOCAL_PATH=src
set TEMP_FTP=%TEMP%\ftp_deploy_!RANDOM!.txt

echo [INFO] Preparando archivos FTP...
echo.

REM Crear script FTP con timeout
(
    echo user %FTP_USER% %FTP_PASS%
    echo binary
    echo hash
    echo cd %FTP_PATH%
    echo lcd %LOCAL_PATH%
    echo mput -R *
    echo quit
) > "%TEMP_FTP%"

echo [INFO] Conectando a FTP...
echo Servidor: %FTP_HOST%
echo Usuario: %FTP_USER%
echo Directorio remoto: %FTP_PATH%
echo Directorio local: %LOCAL_PATH%
echo.

REM Ejecutar FTP con timeout de 60 segundos
timeout /t 2 /nobreak >nul
ftp -w:5000 -s:"%TEMP_FTP%" %FTP_HOST%

REM Verificar resultado
if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo   [OK] DEPLOY COMPLETADO!
    echo ========================================
    echo.
    echo Sitio: https://mlibretools.aigents.com.ar
    echo.
    echo Los cambios pueden tardar unos segundos en verse.
    echo Presione Ctrl+F5 en el navegador para limpiar cache.
    echo.
) else (
    echo.
    echo ========================================
    echo   [ERROR] PROBLEMA EN EL DEPLOY
    echo ========================================
    echo.
    echo Posibles causas:
    echo - Conexion a internet no disponible
    echo - Credenciales FTP incorrectas
    echo - Servidor Spaceship no responde
    echo.
    echo Solucion: Intente de nuevo en unos segundos.
    echo.
)

REM Limpiar
if exist "%TEMP_FTP%" del "%TEMP_FTP%"

pause
