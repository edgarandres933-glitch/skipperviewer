@echo off
chcp 65001 >nul
title Skipper View — Servidor Local
color 0A

:: Asegurar que Bun esté en el PATH
set "PATH=%USERPROFILE%\.bun\bin;%PATH%"

echo ======================================================================
echo                  INICIANDO SKIPPER VIEW
echo ======================================================================
echo.

where bun >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] No se encontró Bun.
    echo Por favor ejecuta primero: INSTALAR-SKIPPER-VIEW.bat
    echo.
    pause
    exit /b 1
)

if not exist node_modules (
    echo [AVISO] Las dependencias no están instaladas.
    echo Instalando ahora...
    call bun install
)

echo Abriendo navegador en http://localhost:8080 ...
start "" "http://localhost:8080/"

echo.
echo ======================================================================
echo  Servidor en ejecución. 
echo  Para cerrar el sistema, simplemente cierra esta ventana.
echo ======================================================================
echo.

bun --bun run dev
