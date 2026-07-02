@echo off
REM __AXFM_NAME__ 실행 스크립트 (cmd — PowerShell 실행정책 문제 회피용)
cd /d "%~dp0"
set PYTHONPATH=%~dp0
where py >nul 2>nul && (py main.py %*) || (python main.py %*)
