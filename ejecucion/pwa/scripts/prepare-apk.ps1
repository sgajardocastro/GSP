$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$pkgPath = Join-Path $root 'package.json'
$pkg = Get-Content $pkgPath -Raw | ConvertFrom-Json
$version = $pkg.version

$twaDir = Join-Path $root 'terracon-twa'
$publicDir = Join-Path $root 'public'

$signedCandidates = @(
  (Join-Path $twaDir 'app-release-signed.apk'),
  (Join-Path $twaDir 'app\build\outputs\apk\release\app-release.apk'),
  (Join-Path $twaDir 'app\build\outputs\apk\release\app-release-signed.apk')
)

$signedSource = $signedCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $signedSource) {
  throw "No se encontro APK firmado. Genera/ubica app-release-signed.apk en terracon-twa antes de continuar."
}

New-Item -ItemType Directory -Path $publicDir -Force | Out-Null

$versionedName = "app-release-signed-$version.apk"
$versionedDest = Join-Path $publicDir $versionedName
$stableDest = Join-Path $publicDir 'app-release-signed.apk'

Copy-Item $signedSource $versionedDest -Force
Copy-Item $signedSource $stableDest -Force

Write-Host "APK firmado preparado:"
Write-Host " - $versionedDest"
Write-Host " - $stableDest"
