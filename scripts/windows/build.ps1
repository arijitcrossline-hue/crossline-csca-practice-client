param(
  [switch]$InstallOnly
)

$ErrorActionPreference = "Stop"
Set-Location (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw "Node.js is required. Install the current Node.js LTS release on Windows first."
}

npm install

if (-not $InstallOnly) {
  npm run dist:win

  $DownloadDir = Join-Path (Get-Location) "src\downloads"
  New-Item -ItemType Directory -Force -Path $DownloadDir | Out-Null

  $Client = Get-ChildItem -Path ".\release" -Filter "*.exe" -Recurse |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

  if ($Client) {
    Copy-Item $Client.FullName (Join-Path $DownloadDir "Crossline-CSCA-Practice-Client.exe") -Force
  }

  Write-Host "Windows packages are ready in .\release"
  Write-Host "Website download files are ready in .\src\downloads"
}
