function Resolve-ContentOSNode {
  param([Parameter(Mandatory=$true)][string]$AppRoot)
  $candidates = @((Join-Path $AppRoot 'tools\node\node.exe'))
  $systemNode = Get-Command node -CommandType Application -ErrorAction SilentlyContinue
  if ($systemNode) { $candidates += $systemNode.Source }
  foreach ($candidate in ($candidates | Select-Object -Unique)) {
    if (-not (Test-Path -LiteralPath $candidate -PathType Leaf)) { continue }
    try {
      $version = & $candidate -p 'process.versions.node' 2>$null
      if ($LASTEXITCODE -eq 0 -and [int]($version.Split('.')[0]) -ge 22) { return $candidate }
    } catch {}
  }
  throw 'ContentOS requires Node.js 22+. No usable tools\node\node.exe or PATH runtime found.'
}
