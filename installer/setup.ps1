param([switch]$NoStart)
$ErrorActionPreference = 'Stop'
$appRoot = Split-Path $PSScriptRoot -Parent
. (Join-Path $PSScriptRoot 'runtime.ps1')
try { $nodeCommand = Resolve-ContentOSNode -AppRoot $appRoot } catch {
  if ($env:PROCESSOR_ARCHITECTURE -ne 'AMD64') { throw 'Automatic Node bootstrap currently supports Windows x64 only.' }
  $version = '24.14.1'
  $archiveName = "node-v$version-win-x64.zip"
  $baseUrl = "https://nodejs.org/dist/v$version"
  $toolRoot = Join-Path $appRoot 'tools'
  $destination = Join-Path $toolRoot 'node'
  if (Test-Path -LiteralPath $destination) { throw 'Existing tools\node is unusable. Preserve and inspect it before retrying.' }
  New-Item -ItemType Directory -Path $toolRoot -Force | Out-Null
  $stage = Join-Path $toolRoot ('node-stage-' + [guid]::NewGuid().ToString())
  New-Item -ItemType Directory -Path $stage | Out-Null
  try {
    $archive = Join-Path $stage $archiveName
    Invoke-WebRequest "$baseUrl/$archiveName" -OutFile $archive -UseBasicParsing
    $checksums = (Invoke-WebRequest "$baseUrl/SHASUMS256.txt" -UseBasicParsing).Content
    $match = [regex]::Match($checksums, '(?m)^([a-f0-9]{64})\s+' + [regex]::Escape($archiveName) + '\s*$')
    if (-not $match.Success) { throw 'Official Node checksum missing.' }
    if ((Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash.ToLowerInvariant() -ne $match.Groups[1].Value) { throw 'Node checksum mismatch.' }
    Expand-Archive -LiteralPath $archive -DestinationPath $stage
    $extracted = [IO.Path]::GetFullPath((Join-Path $stage "node-v$version-win-x64"))
    $resolvedStageRoot = [IO.Path]::GetFullPath($stage) + [IO.Path]::DirectorySeparatorChar
    if (-not $extracted.StartsWith($resolvedStageRoot,[StringComparison]::OrdinalIgnoreCase)) { throw 'Unexpected extracted runtime path.' }
    if (Test-Path -LiteralPath $destination) { throw 'Node destination changed during installation. Retry after inspection.' }
    Move-Item -LiteralPath $extracted -Destination $destination
  } finally {
    $resolvedStage = [IO.Path]::GetFullPath($stage)
    $resolvedTools = [IO.Path]::GetFullPath($toolRoot) + [IO.Path]::DirectorySeparatorChar
    if (-not $resolvedStage.StartsWith($resolvedTools,[StringComparison]::OrdinalIgnoreCase)) { throw 'Unexpected staging path.' }
    Remove-Item -LiteralPath $resolvedStage -Recurse -Force
  }
  $nodeCommand = Resolve-ContentOSNode -AppRoot $appRoot
}
$nodeFolder = Split-Path $nodeCommand -Parent
$env:PATH = $nodeFolder + [IO.Path]::PathSeparator + $env:PATH
$npmCli = Join-Path $nodeFolder 'node_modules\npm\bin\npm-cli.js'
if (-not (Test-Path -LiteralPath $npmCli)) {
  $npmCommand = Get-Command npm.cmd -CommandType Application -ErrorAction SilentlyContinue
  if ($npmCommand) { $npmCli = Join-Path (Split-Path $npmCommand.Source -Parent) 'node_modules\npm\bin\npm-cli.js' }
}
if (-not (Test-Path -LiteralPath $npmCli)) { throw 'npm CLI missing. Use a full Node distribution including npm.' }
& $nodeCommand (Join-Path $PSScriptRoot 'setup.mjs') --npm-cli $npmCli
if ($LASTEXITCODE -ne 0) { throw 'ContentOS setup incomplete. See errors above; retry after correcting the reported component.' }
& $nodeCommand (Join-Path $PSScriptRoot 'doctor.mjs')
if ($LASTEXITCODE -ne 0) { throw 'ContentOS environment checks failed.' }
if (-not $NoStart) { & (Join-Path $PSScriptRoot 'start.ps1') }
