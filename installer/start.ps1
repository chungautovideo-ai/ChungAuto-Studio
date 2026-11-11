$ErrorActionPreference = 'Stop'
$appRoot = Split-Path $PSScriptRoot -Parent
. (Join-Path $PSScriptRoot 'runtime.ps1')
# Bản gọn / máy mới: thiếu runtime hoặc model thì hỏi tải (chép từ server trước, rồi mới tải internet)
. (Join-Path $PSScriptRoot 'ensure-runtime.ps1')
Invoke-ContentOSRuntimeCheck -AppRoot $appRoot
$nodeCommand = Resolve-ContentOSNode -AppRoot $appRoot
$env:PATH = (Split-Path $nodeCommand -Parent) + [IO.Path]::PathSeparator + $env:PATH
# Dự án / mẫu thường nằm trên NAS: mặc định Node chỉ có 4 luồng đọc file → lượt quét danh sách chặn mọi yêu cầu khác
if (-not $env:UV_THREADPOOL_SIZE) { $env:UV_THREADPOOL_SIZE = '32' }
$logRoot = Join-Path $appRoot 'workspace\logs'
New-Item -ItemType Directory -Path $logRoot -Force | Out-Null
# Chạy trên ổ mạng (SMB) server có thể trả lời chậm vài chục giây: timeout không có nghĩa là "cổng bận".
$otherApp = $false
try {
  $ping = Invoke-RestMethod 'http://127.0.0.1:5180/api/ping' -TimeoutSec 30
  if ($ping.app -ne 'contentos') { $otherApp = $true }
} catch {
  if (-not (Get-NetTCPConnection -LocalPort 5180 -State Listen -ErrorAction SilentlyContinue)) {
    $serverPath = Join-Path $appRoot 'editor\server.mjs'
    $process = Start-Process -FilePath $nodeCommand -ArgumentList @('"' + $serverPath + '"', '--home', '--port', '5180') -WorkingDirectory $appRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $logRoot 'server.out.log') -RedirectStandardError (Join-Path $logRoot 'server.err.log') -PassThru
    Set-Content -LiteralPath (Join-Path $logRoot 'server.pid') -Value $process.Id
  }
  # Nếu đã có tiến trình giữ cổng mà chưa trả lời kịp: chờ ở vòng dưới, không khởi động bản thứ hai và không dừng app đang chạy.
}
if ($otherApp) { throw 'Cổng 5180 đang được app khác sử dụng.' }
$ready = $false
$deadline = (Get-Date).AddSeconds(150)
while ((Get-Date) -lt $deadline) {
  try { $ping = Invoke-RestMethod 'http://127.0.0.1:5180/api/ping' -TimeoutSec 30; if ($ping.app -eq 'contentos') { $ready = $true; break } else { throw 'Cổng 5180 đang được app khác sử dụng.' } } catch { if ($_.Exception.Message -like '*app khác*') { throw } }
  Start-Sleep -Milliseconds 500
}
if (-not $ready) { throw 'Chưa mở được ContentOS (server phản hồi quá chậm hoặc lỗi). Xem workspace\logs\server.err.log.' }
Write-Output 'ContentOS ready: http://127.0.0.1:5180/home'
