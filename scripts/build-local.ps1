$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Push-Location (Join-Path $projectRoot 'frontend')
try {
    New-Item -ItemType Directory -Force dist/assets | Out-Null
    & './node_modules/@esbuild/win32-x64/esbuild.exe' src/main.jsx --bundle --minify --format=esm --jsx=automatic --external:tailwindcss --outfile=dist/assets/game.js
    if ($LASTEXITCODE -ne 0) { throw 'JavaScript build failed.' }
    node scripts/finish-local-build.mjs
    if ($LASTEXITCODE -ne 0) { throw 'CSS build failed.' }
} finally {
    Pop-Location
}
