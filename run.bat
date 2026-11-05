@echo off
title Destro's BATTLE SPIRITS Colosseum - Modern Pure Engine
cls
echo ========================================================
echo   Destro's BATTLE SPIRITS Colosseum (Modern Engine)
echo ========================================================

echo.
echo   Starting modern Node.js server at:
echo   -> http://127.0.0.1:3000
echo   -> http://localhost:3000
echo.
echo   NOTE FOR OPERA / OPERA GX USERS:
echo   If you have the blue [VPN] badge enabled in Opera's
echo   address bar, please click [VPN] and TOGGLE IT OFF
echo   for localhost / 127.0.0.1.
echo.
echo ========================================================
echo.

start http://127.0.0.1:3000
node server.js

pause
