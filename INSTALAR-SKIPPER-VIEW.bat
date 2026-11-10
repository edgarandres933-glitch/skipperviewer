@echo off
chcp 65001 >nul
title Instalador de Skipper View
color 0B

echo ======================================================================
echo           INSTALADOR AUTOMÁTICO DE SKIPPER VIEW
echo ======================================================================
echo.

:: 1. Comprobar si Bun está instalado
echo [1/3] Verificando entorno de ejecución...
where bun >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo [AVISO] Bun no está instalado en este equipo.
    echo Instalando Bun de manera rápida y segura...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "irm bun.sh/install.ps1 | iex"
    
    :: Agregar Bun a la sesión actual
    set "PATH=%USERPROFILE%\.bun\bin;%PATH%"
    
    where bun >nul 2>nul
    if %errorlevel% neq 0 (
        echo.
        echo [ERROR] No se pudo instalar Bun automáticamente.
        echo Por favor abre PowerShell y ejecuta:
        echo   irm bun.sh/install.ps1 ^| iex
        echo Luego vuelve a ejecutar este instalador.
        pause
        exit /b 1
    )
    echo [OK] Bun instalado correctamente.
) else (
    echo [OK] Bun ya está instalado.
)

:: 2. Verificar archivo .env
echo.
echo [2/3] Configurando variables de entorno (.env)...
if not exist .env (
    echo GHL_PRIVATE_TOKEN=pit-a8674944-47b0-410d-9c27-f5c5f27f9ac5> .env
    echo [OK] Archivo .env configurado con el token de acceso.
) else (
    echo [OK] Archivo .env ya existe.
)

:: 3. Instalar dependencias
echo.
echo [3/3] Descargando e instalando librerías del sistema...
echo (Esto puede tardar entre 15 y 30 segundos)...
echo.
call bun install
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Hubo un error al instalar las dependencias con Bun.
    pause
    exit /b 1
)

echo.
echo ======================================================================
echo   ¡INSTALACIÓN COMPLETADA EXITOSAMENTE!
echo ======================================================================
echo.
echo Para abrir el sistema cuando quieras, simplemente haz doble clic
echo en el archivo:
echo   --^> INICIAR-SKIPPER-VIEW.bat
echo.
pause
