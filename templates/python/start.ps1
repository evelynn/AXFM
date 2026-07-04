# __AXFM_NAME__ 실행 스크립트 (PowerShell — 5.1 호환 문법만 사용)
# 실행이 막히면 .\start.cmd 를 사용하세요.
$ErrorActionPreference = "Stop"
Set-Location -Path $PSScriptRoot

# AXFM 파이썬 모듈 경로를 추가 (모듈은 프로젝트 안 axfm/ 에 vendored 됨)
$env:PYTHONPATH = $PSScriptRoot

$py = Get-Command py -ErrorAction SilentlyContinue
if (-not $py) { $py = Get-Command python -ErrorAction SilentlyContinue }
if (-not $py) {
  Write-Host "Python 이 설치돼 있지 않습니다. https://www.python.org 에서 3.10+ 를 설치하세요." -ForegroundColor Red
  exit 1
}
& $py.Source main.py @args
exit $LASTEXITCODE
