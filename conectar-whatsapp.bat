@echo off
cd /d "%~dp0"
title NTPlay - Conectar WhatsApp
if exist "auth\qr.png" del "auth\qr.png"
start "" /b cmd /c "npm run login"
:wait
if exist "auth\qr.png" goto show
timeout /t 1 /nobreak >nul
goto wait
:show
start "" "%~dp0auth\qr.png"
echo Escaneie o QR que abriu na tela com o WhatsApp do numero comercial.
echo WhatsApp ^> Configuracoes ^> Dispositivos conectados ^> Conectar dispositivo.
pause
