param(
  [switch]$KeepUserData
)

$ErrorActionPreference = "SilentlyContinue"

$appGuid = "9cac88bc-f4cf-5b29-b56a-ce73c5b5f750"
$productName = "Crossline CSCA Practice Client"
$shortcutName = "Crossline CSCA Practice"
$menuFolder = "Crossline Education"

Write-Host "Crossline CSCA Practice cleanup"
Write-Host "Closing running app processes..."

$processNames = @(
  "Crossline CSCA Practice Client",
  "Crossline-CSCA-Practice-Setup"
)

foreach ($name in $processNames) {
  Get-Process -Name $name -ErrorAction SilentlyContinue | Stop-Process -Force
}

Start-Sleep -Milliseconds 800

$installLocations = New-Object System.Collections.Generic.HashSet[string]

$registryRoots = @(
  "HKCU:\Software\$appGuid",
  "HKLM:\Software\$appGuid",
  "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\$appGuid",
  "HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\$appGuid",
  "HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\$appGuid"
)

foreach ($key in $registryRoots) {
  $props = Get-ItemProperty -Path $key -ErrorAction SilentlyContinue
  if ($props.InstallLocation) {
    [void]$installLocations.Add($props.InstallLocation)
  }
}

$defaultLocations = @(
  "$env:LOCALAPPDATA\Programs\$productName",
  "$env:LOCALAPPDATA\Programs\$shortcutName",
  "$env:ProgramFiles\$productName",
  "${env:ProgramFiles(x86)}\$productName"
)

foreach ($path in $defaultLocations) {
  if ($path) { [void]$installLocations.Add($path) }
}

Write-Host "Removing installed application files..."
foreach ($path in $installLocations) {
  if ($path -and (Test-Path $path)) {
    Write-Host "Removing $path"
    Remove-Item -LiteralPath $path -Recurse -Force
  }
}

Write-Host "Removing updater cache..."
Remove-Item -LiteralPath "$env:LOCALAPPDATA\csca-practice-client-updater" -Recurse -Force
Remove-Item -LiteralPath "$env:LOCALAPPDATA\crossline-csca-practice-client-updater" -Recurse -Force

if (-not $KeepUserData) {
  Write-Host "Removing saved app data..."
  Remove-Item -LiteralPath "$env:APPDATA\csca-practice-client" -Recurse -Force
  Remove-Item -LiteralPath "$env:APPDATA\Crossline CSCA Practice Client" -Recurse -Force
}

Write-Host "Removing shortcuts..."
$shortcutPaths = @(
  "$env:USERPROFILE\Desktop\$shortcutName.lnk",
  "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\$shortcutName.lnk",
  "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\$menuFolder\$shortcutName.lnk",
  "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\$menuFolder\Uninstall Crossline CSCA Practice.lnk",
  "$env:ProgramData\Microsoft\Windows\Start Menu\Programs\$shortcutName.lnk",
  "$env:ProgramData\Microsoft\Windows\Start Menu\Programs\$menuFolder\$shortcutName.lnk",
  "$env:ProgramData\Microsoft\Windows\Start Menu\Programs\$menuFolder\Uninstall Crossline CSCA Practice.lnk"
)

foreach ($shortcut in $shortcutPaths) {
  Remove-Item -LiteralPath $shortcut -Force
}

Remove-Item -LiteralPath "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\$menuFolder" -Force
Remove-Item -LiteralPath "$env:ProgramData\Microsoft\Windows\Start Menu\Programs\$menuFolder" -Force

Write-Host "Removing registry entries..."
foreach ($key in $registryRoots) {
  Remove-Item -Path $key -Recurse -Force
}

Write-Host ""
Write-Host "Cleanup complete. Restart Windows if the app still appears in Settings."
Write-Host "You can now install the latest Crossline setup again."

