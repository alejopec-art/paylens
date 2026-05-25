$projectDir = "C:\Users\Administrador\Documents\PayLens"
$pythonExe = Join-Path $projectDir ".venv\Scripts\python.exe"
$logDir = Join-Path $projectDir "logs"
$logFile = Join-Path $logDir "paylens.log"
$outFile = Join-Path $logDir "paylens.out.log"
$errFile = Join-Path $logDir "paylens.err.log"

New-Item -ItemType Directory -Force -Path $logDir | Out-Null

try {
  if (Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue) {
    exit 0
  }

  $args = @(
    "-m", "uvicorn", "main:app",
    "--app-dir", $projectDir,
    "--host", "0.0.0.0",
    "--port", "8080"
  )

  Start-Process -FilePath $pythonExe -ArgumentList $args -WorkingDirectory $projectDir -WindowStyle Hidden -RedirectStandardOutput $outFile -RedirectStandardError $errFile
} catch {
  $_ | Out-String | Add-Content -Path $logFile
  exit 1
}
