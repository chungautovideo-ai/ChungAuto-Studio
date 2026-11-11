# Kiểm runtime/model khi mở ContentOS (gọi từ start.ps1). Thiếu thì hỏi người dùng bằng hộp thoại Windows:
# chép từ server trước (installer\runtime-sources.txt hoặc biến CONTENTOS_RUNTIME_SOURCE), còn thiếu thì tải bằng setup.ps1.
# Chỉ kiểm file có mặt (nhanh, chạy được khi app nằm trên NAS); kiểm sâu dùng doctor.ps1.
Add-Type -AssemblyName System.Windows.Forms

function Get-ContentOSRuntimeParts {
  param([Parameter(Mandatory=$true)][string]$AppRoot)
  $whisper = Join-Path $AppRoot 'tools\whisper'
  $chrome = Join-Path $env:USERPROFILE '.cache\hyperframes\chrome'
  $parts = @(
    @{ id='node'; name='Node.js (chạy app)'; mb=100; optional=$false; copy=@('tools\node')
       ok={ try { $null = Resolve-ContentOSNode -AppRoot $AppRoot; $true } catch { $false } } }
    @{ id='editor-modules'; name='Thư viện editor'; mb=150; optional=$false; copy=@('editor\node_modules')
       ok={ Test-Path -LiteralPath (Join-Path $AppRoot 'editor\node_modules\@anthropic-ai\sdk\package.json') } }
    @{ id='ffmpeg'; name='FFmpeg (dựng, xuất video)'; mb=420; optional=$false; copy=@('tools\ffmpeg')
       ok={ (Test-Path -LiteralPath (Join-Path $AppRoot 'tools\ffmpeg\ffmpeg.exe')) -and (Test-Path -LiteralPath (Join-Path $AppRoot 'tools\ffmpeg\ffprobe.exe')) } }
    @{ id='vision'; name='Python xử lý hình (biển số, preset)'; mb=350; optional=$false; copy=@('tools\vision-embedded','tools\vision-python','tools\preset-fields')
       ok={ Test-Path -LiteralPath (Join-Path $AppRoot 'tools\vision-embedded\python.exe') } }
    @{ id='whisper'; name='Whisper nhận giọng tiếng Việt'; mb=560; optional=$false; copy=@('tools\whisper')
       ok={ (Test-Path -LiteralPath $whisper) -and @(Get-ChildItem -LiteralPath $whisper -Recurse -Filter 'whisper-cli.exe' -ErrorAction SilentlyContinue).Count -gt 0 -and @(Get-ChildItem -LiteralPath $whisper -Filter '*.bin' -ErrorAction SilentlyContinue).Count -gt 0 } }
    @{ id='remotion'; name='Remotion (cảnh chữ động)'; mb=200; optional=$false; copy=@('engines\remotion\node_modules')
       ok={ Test-Path -LiteralPath (Join-Path $AppRoot 'engines\remotion\node_modules\remotion\package.json') } }
    @{ id='render-browser'; name='Trình duyệt render (tải từ internet)'; mb=250; optional=$false; copy=@()
       ok={ Test-Path -LiteralPath $chrome } }
    @{ id='sam2'; name='SAM2 tách người, làm đẹp theo người (tuỳ chọn)'; mb=4700; optional=$true; copy=@('tools\sam2-python','tools\models')
       ok={ (Test-Path -LiteralPath (Join-Path $AppRoot 'tools\sam2-python\python.exe')) -and (Test-Path -LiteralPath (Join-Path $AppRoot 'tools\models\sam2.1-hiera-tiny\model.safetensors')) } }
  )
  # khối ok chạy sau, ở phạm vi khác: giữ lại $AppRoot/$whisper/$chrome của hàm này
  foreach ($p in $parts) { $p.ok = $p.ok.GetNewClosure() }
  $parts
}

function Get-ContentOSRuntimeSources {
  param([Parameter(Mandatory=$true)][string]$AppRoot)
  $list = @()
  if ($env:CONTENTOS_RUNTIME_SOURCE) { $list += $env:CONTENTOS_RUNTIME_SOURCE }
  $file = Join-Path $AppRoot 'installer\runtime-sources.txt'
  if (Test-Path -LiteralPath $file) { $list += Get-Content -LiteralPath $file -Encoding UTF8 | ForEach-Object { $_.Trim() } | Where-Object { $_ -and -not $_.StartsWith('#') } }
  $self = [IO.Path]::GetFullPath($AppRoot).TrimEnd('\')
  $list | Where-Object { (Test-Path -LiteralPath $_) -and ([IO.Path]::GetFullPath($_).TrimEnd('\') -ne $self) } | Select-Object -Unique
}

# Chép các thư mục của một phần từ nguồn đầu tiên có đủ. Trả $true khi phần đó dùng được sau khi chép.
function Copy-ContentOSRuntimePart {
  param($Part, [string]$AppRoot, [string[]]$Sources)
  if (-not $Part.copy.Count) { return $false }
  foreach ($src in $Sources) {
    if (@($Part.copy | Where-Object { -not (Test-Path -LiteralPath (Join-Path $src $_)) }).Count) { continue }
    foreach ($rel in $Part.copy) {
      # robocopy: mã < 8 là thành công; /XO giữ file mới hơn đang có
      & robocopy (Join-Path $src $rel) (Join-Path $AppRoot $rel) /E /XO /MT:16 /R:2 /W:2 /NFL /NDL /NJH /NJS /NP | Out-Null
      if ($LASTEXITCODE -ge 8) { break }
    }
    if (& $Part.ok) { return $true }
  }
  $false
}

function Invoke-ContentOSRuntimeCheck {
  param([Parameter(Mandatory=$true)][string]$AppRoot, [switch]$ReportOnly)
  $choiceFile = Join-Path $AppRoot 'workspace\contentos\runtime-choice.json'
  $skip = @(); try { $skip = @((Get-Content -LiteralPath $choiceFile -Raw -Encoding UTF8 -ErrorAction Stop | ConvertFrom-Json).skipOptional) } catch {}
  $missing = @(Get-ContentOSRuntimeParts -AppRoot $AppRoot | Where-Object { -not (& $_.ok) })
  $ask = @($missing | Where-Object { -not $_.optional -or $skip -notcontains $_.id })
  if ($ReportOnly) { return $missing }
  if (-not $ask.Count) { return }
  $sources = @(Get-ContentOSRuntimeSources -AppRoot $AppRoot)
  $required = @($ask | Where-Object { -not $_.optional }); $optional = @($ask | Where-Object { $_.optional })
  $where = if ($sources.Count) { "Tìm trên server trước:`n  " + ($sources -join "`n  ") + "`nphần không có trên server sẽ tải từ internet." } else { 'Chưa thấy bản trên server: sẽ tải từ internet.' }
  $doRequired = $false
  if ($required.Count) {
    $text = "ContentOS cần thêm các phần sau trên máy này:`n`n" + (($required | ForEach-Object { "  • $($_.name) (~$($_.mb) MB)" }) -join "`n") + "`n`n$where`n`nTải về ngay?"
    $doRequired = [Windows.Forms.MessageBox]::Show($text, 'ContentOS — thiếu phần mềm/model', 'YesNo', 'Question') -eq 'Yes'
    $nodeMissing = @($required | Where-Object id -eq 'node').Count -gt 0
    if (-not $doRequired -and $nodeMissing) { throw 'ContentOS cần Node.js để chạy. Mở lại app và chọn tải về.' }
  }
  $doOptional = @()
  foreach ($o in $optional) {
    $answer = [Windows.Forms.MessageBox]::Show("Tải thêm $($o.name)? (~$([math]::Round($o.mb/1024,1)) GB)`n`nCần cho tính năng tách/chọn người. Có thể bỏ qua và dùng app bình thường.`n`n$where`n`nChọn Không: không hỏi lại (cài sau bằng installer\setup-person.mjs).", 'ContentOS — model tuỳ chọn', 'YesNo', 'Question')
    if ($answer -eq 'Yes') { $doOptional += $o } else { $skip += $o.id }
  }
  try { New-Item -ItemType Directory -Force -Path (Split-Path $choiceFile -Parent) | Out-Null; @{ skipOptional = @($skip | Select-Object -Unique); at = (Get-Date).ToUniversalTime().ToString('o') } | ConvertTo-Json | Set-Content -LiteralPath $choiceFile -Encoding UTF8 } catch {}
  $todo = @(@(if ($doRequired) { $required }) + $doOptional)
  if (-not $todo.Count) { return }
  $left = @($todo | Where-Object { -not (Copy-ContentOSRuntimePart -Part $_ -AppRoot $AppRoot -Sources $sources) })
  if (@($left | Where-Object { -not $_.optional }).Count) {
    # Cửa sổ hiện tiến trình tải: setup.ps1 tự bỏ qua phần đã có
    $p = Start-Process powershell.exe -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-File',('"' + (Join-Path $AppRoot 'installer\setup.ps1') + '"'),'-NoStart') -Wait -PassThru
    if ($p.ExitCode -ne 0) { [Windows.Forms.MessageBox]::Show("Tải chưa đủ (mã $($p.ExitCode)). App vẫn mở, tính năng thiếu sẽ báo khi dùng. Kiểm tra: installer\doctor.ps1", 'ContentOS', 'OK', 'Warning') | Out-Null }
  }
  if (@($left | Where-Object { $_.id -eq 'sam2' }).Count) {
    $node = Resolve-ContentOSNode -AppRoot $AppRoot
    Start-Process $node -ArgumentList @(('"' + (Join-Path $AppRoot 'installer\setup-person.mjs') + '"')) -WorkingDirectory $AppRoot -Wait | Out-Null
  }
}
