# Đóng gói ContentOS thành bản gọn để mang đi (máy khác, thư mục khác trên server) — không đụng bản đang dùng.
#   powershell -NoProfile -ExecutionPolicy Bypass -File installer\dong-goi.ps1 -Destination "X:\STUDIO AI\ContentOS 2.0" [-NasRoot "\\chungauto\Quay Dựng 2"] [-Full]
# Bản gọn bỏ runtime/model (tools\, node_modules), cache, dự án, bản xuất, log, mẫu và không gian làm việc do test tạo.
# Lần đầu mở, start.ps1 → ensure-runtime.ps1 hỏi tải phần thiếu (chép từ server trong installer\runtime-sources.txt trước).
# -Full: giữ cả runtime/model (khoảng 6 GB) để máy đích không cần tải.
param([Parameter(Mandatory=$true)][string]$Destination, [string]$NasRoot = '', [switch]$Full)
$ErrorActionPreference = 'Stop'
$appRoot = Split-Path $PSScriptRoot -Parent
$dest = [IO.Path]::GetFullPath($Destination).TrimEnd('\')
if ($dest -eq [IO.Path]::GetFullPath($appRoot).TrimEnd('\')) { throw 'Thư mục đích trùng bản đang dùng.' }
if ((Test-Path -LiteralPath $dest) -and @(Get-ChildItem -LiteralPath $dest -Force).Count) { throw "Thư mục đích đã có dữ liệu, không ghi đè: $dest" }

$isQa = '^(QA|Kiểm thử|ContentOS-Smoke|Revision result QA|Image API QA|Plate review completion|Small face benchmark)'
$xd = @('.history', '.editor-cache', '.hyperframes', '__pycache__',
  (Join-Path $appRoot 'node_modules'), (Join-Path $appRoot 'exports'),
  (Join-Path $appRoot 'workspace\cache'), (Join-Path $appRoot 'workspace\content'), (Join-Path $appRoot 'workspace\exports'), (Join-Path $appRoot 'workspace\logs'))
$xd += @(Get-ChildItem -LiteralPath (Join-Path $appRoot 'workspace\contentos') -Directory -Filter 'qa-*' -ErrorAction SilentlyContinue | ForEach-Object FullName)
# Mẫu do test tạo ("QA Audio Style"…): chỉ có trong templates\custom-*
$xd += @(Get-ChildItem -LiteralPath (Join-Path $appRoot 'editor\templates') -Directory -Filter 'custom-*' | Where-Object {
  try { (Get-Content -LiteralPath (Join-Path $_.FullName 'template.json') -Raw -Encoding UTF8 | ConvertFrom-Json).name -match $isQa } catch { $false } } | ForEach-Object FullName)
if (-not $Full) { $xd += @((Join-Path $appRoot 'tools'), (Join-Path $appRoot 'editor\node_modules'), (Join-Path $appRoot 'engines\remotion\node_modules')) }
$xf = @('*.log', 'server.pid', 'runtime-choice.json', '.account.json', 'Thumbs.db', '.DS_Store')

$log = @(& robocopy $appRoot $dest /E /MT:16 /R:1 /W:1 /NFL /NDL /NP /XD @xd /XF @xf)
$code = $LASTEXITCODE
$log | Select-Object -Last 12
# Bản gốc không bị đụng: file không đọc được (vd quyền NAS hỏng) chỉ báo lại, không bỏ cả bản đóng gói
$failed = @($log | Where-Object { $_ -match 'ERROR \d+ .*Copying File (.+)$' } | ForEach-Object { $Matches[1].Trim() } | Select-Object -Unique)
if ($failed.Count) { Write-Warning ("Không chép được {0} file (bản gốc giữ nguyên):`n  {1}" -f $failed.Count, ($failed -join "`n  ")) }
elseif ($code -ge 8) { throw "robocopy lỗi (mã $code)" }

# Không gian làm việc: bỏ các không gian do test tạo, gán kho NAS cho ChungAuto nếu có -NasRoot
$wsFile = Join-Path $dest 'workspace\contentos\workspaces.json'
if (Test-Path -LiteralPath $wsFile) {
  $ws = Get-Content -LiteralPath $wsFile -Raw -Encoding UTF8 | ConvertFrom-Json
  # không gian do test tạo luôn kết thúc bằng mốc thời gian 13 chữ số ("Face source QA 1793810440131")
  $ws.workspaces = @($ws.workspaces | Where-Object { $_.name -notmatch $isQa -and $_.name -notmatch '\s\d{12,}$' })
  if ($NasRoot) { foreach ($w in $ws.workspaces) { if ($w.name -eq 'ChungAuto') { $w.nasRoot = $NasRoot } } }
  if (-not ($ws.workspaces | Where-Object id -eq $ws.activeId)) { $ws.activeId = $ws.workspaces[0].id }
  [IO.File]::WriteAllText($wsFile, ($ws | ConvertTo-Json -Depth 10), [Text.UTF8Encoding]::new($false))
}
foreach ($d in 'workspace\content', 'workspace\logs', 'workspace\exports') { New-Item -ItemType Directory -Force -Path (Join-Path $dest $d) | Out-Null }
$size = (Get-ChildItem -LiteralPath $dest -Recurse -File -Force | Measure-Object Length -Sum).Sum
Write-Output ("Đã đóng gói: {0} ({1:N2} GB){2}" -f $dest, ($size / 1GB), $(if ($Full) { '' } else { ' — lần đầu mở sẽ hỏi tải runtime/model' }))
