param([Parameter(Mandatory=$true)][string]$SourceRoot)
$ErrorActionPreference = 'Stop'
$appRoot = Split-Path $PSScriptRoot -Parent
$source = (Resolve-Path -LiteralPath (Join-Path $SourceRoot 'tools\whisper')).Path
$sourceBin = Join-Path $source 'bin\Release'
$modelName = 'ggml-large-v3-turbo-q5_0.bin'
$model = Join-Path $source $modelName
if (-not (Test-Path -LiteralPath (Join-Path $sourceBin 'whisper-cli.exe'))) { throw 'Không tìm thấy whisper-cli.exe đã cài.' }
if ((Get-Item -LiteralPath $model).Length -ne 574041195) { throw 'Model Whisper không đúng kích thước dự kiến.' }
$toolRoot = Join-Path $appRoot 'tools'
New-Item -ItemType Directory -Path $toolRoot -Force | Out-Null
$destination = Join-Path $toolRoot 'whisper'
if (Test-Path -LiteralPath $destination) { throw 'Đã có tools\whisper. Kiểm tra bản hiện tại trước khi nhập lại.' }
$stage = Join-Path $toolRoot ('whisper-staging-' + [guid]::NewGuid().ToString())
New-Item -ItemType Directory -Path (Join-Path $stage 'bin\Release') -Force | Out-Null
try {
  $files = @((Get-Item -LiteralPath $model), (Get-Item -LiteralPath (Join-Path $sourceBin 'whisper-cli.exe'))) + @(Get-ChildItem -LiteralPath $sourceBin -Filter '*.dll' -File)
  $manifest = @()
  foreach ($file in $files) {
    if ($file.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'Không nhập file công cụ qua liên kết.' }
    $relative = if ($file.FullName -eq $model) { $modelName } else { 'bin\Release\' + $file.Name }
    $before = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash
    $target = Join-Path $stage $relative
    Copy-Item -LiteralPath $file.FullName -Destination $target
    $copied = (Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash
    $after = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash
    if ($before -ne $copied -or $before -ne $after) { throw "Checksum không khớp: $relative" }
    $manifest += @{path=$relative;bytes=$file.Length;sha256=$copied.ToLowerInvariant()}
  }
  @{schemaVersion=1;source=$source;importedAt=[DateTime]::UtcNow.ToString('o');files=$manifest} | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $stage 'import-manifest.json') -Encoding UTF8
  Move-Item -LiteralPath $stage -Destination $destination
  Write-Output "Whisper đã nhập vào $destination; $($manifest.Count) file đã đối chiếu SHA256."
} catch {
  # Keep staging for diagnosis; do not remove computed directories automatically.
  Write-Warning "Nhập chưa hoàn tất. Dữ liệu tạm: $stage"
  throw
}
