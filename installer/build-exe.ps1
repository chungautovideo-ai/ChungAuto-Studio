$ErrorActionPreference = 'Stop'
# Builds ContentOS.exe in the app root with the .NET Framework compiler that ships with Windows (no extra install).
$appRoot = Split-Path $PSScriptRoot -Parent
$csc = Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'
if (-not (Test-Path $csc)) { throw 'Không tìm thấy csc.exe của .NET Framework 4.' }
$output = Join-Path $appRoot 'ContentOS.exe'
& $csc /nologo /codepage:65001 /target:winexe /optimize+ "/out:$output" "/win32icon:$(Join-Path $appRoot 'editor\ui\autosocial.ico')" /reference:System.Windows.Forms.dll (Join-Path $PSScriptRoot 'ContentOS-launcher.cs')
if ($LASTEXITCODE -ne 0) { throw 'Biên dịch ContentOS.exe thất bại.' }
Write-Output "Đã tạo $output"
