$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$dir = Resolve-Path "apps/web/public/landing-new/personas"

function New-EmbeddedPngSvg([string]$baseName) {
  $png = Join-Path $dir ("{0}.png" -f $baseName)
  $out = Join-Path $dir ("{0}.png.svg" -f $baseName)
  if (-not (Test-Path -LiteralPath $png)) { throw "Missing input PNG: $png" }

  $img = [System.Drawing.Image]::FromFile($png)
  $w = $img.Width
  $h = $img.Height
  $img.Dispose()

  $bytes = [System.IO.File]::ReadAllBytes($png)
  $b64 = [Convert]::ToBase64String($bytes)

  $svg = @"
<?xml version=""1.0"" encoding=""UTF-8""?>
<svg xmlns=""http://www.w3.org/2000/svg"" width=""$w"" height=""$h"" viewBox=""0 0 $w $h"">
  <image width=""$w"" height=""$h"" href=""data:image/png;base64,$b64"" />
</svg>
"@

  Set-Content -Path $out -Value $svg -Encoding utf8
  Write-Host "Wrote: $out ($w x $h)"
}

New-EmbeddedPngSvg "salesman"
New-EmbeddedPngSvg "real-estate"
New-EmbeddedPngSvg "customer-success"

Get-ChildItem -LiteralPath $dir -Filter "*.png.svg" | Sort-Object Name | Select-Object Name,Length | Format-Table -AutoSize | Out-String | Write-Host
