@echo off
setlocal
cd /d "%~dp0"
echo Crossline CSCA Practice cleanup
echo.
echo This will remove the broken installed Crossline app, shortcuts, updater cache, and registry entries.
echo.
pause
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0clean-crossline-install.ps1"
echo.
pause

