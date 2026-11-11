param([switch]$Person)
$ErrorActionPreference = 'Stop'
$appRoot = Split-Path $PSScriptRoot -Parent
. (Join-Path $PSScriptRoot 'runtime.ps1')
$nodeCommand = Resolve-ContentOSNode -AppRoot $appRoot
$doctorArgs = @()
if ($Person) { $doctorArgs += '--person' }
& $nodeCommand (Join-Path $PSScriptRoot 'doctor.mjs') @doctorArgs
exit $LASTEXITCODE
