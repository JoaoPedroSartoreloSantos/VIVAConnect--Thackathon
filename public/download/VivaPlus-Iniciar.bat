@echo off
title Viva+ - Tecnologia que entende você
echo ============================================================
echo   VIVA+ - Tecnologia Assistiva e Saude
echo   Enxergue - Entenda - Decida - Viva.
echo ============================================================
echo Abrindo o aplicativo Viva+ no seu navegador padrao...
start https://mysteryjonyp.github.io/vivaplus/ 2>nul || start http://localhost:3000/ 2>nul || start "" "%~dp0..\index.html"
exit
