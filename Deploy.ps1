# Deploy Monitor ML a Spaceship via FTP

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DEPLOY MONITOR ML A SPACESHIP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$FTP_HOST = "mlibretools.aigents.com.ar"
$FTP_USER = "ftplay@mlibretools.aigents.com.ar"
$FTP_PASS = "7948.TresSeis"
$FTP_PATH = "/home/jmyqoqyfsb/mlibretools.aigents.com.ar"
$LOCAL_PATH = "src"

Write-Host "[INFO] Conectando a FTP..." -ForegroundColor Yellow

$uploadedCount = 0
$errorCount = 0

Get-ChildItem -Path $LOCAL_PATH -Recurse -File | ForEach-Object {
    $file = $_
    $relPath = $file.FullName.Substring((Get-Item $LOCAL_PATH).FullName.Length + 1)
    $remotePath = "$FTP_PATH/$($relPath -replace '\\', '/')"

    try {
        $fileStream = [System.IO.File]::OpenRead($file.FullName)
        $ftpRequest = [System.Net.FtpWebRequest]::Create("ftp://$FTP_HOST$remotePath")
        $ftpRequest.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
        $ftpRequest.Credentials = New-Object System.Net.NetworkCredential($FTP_USER, $FTP_PASS)
        $ftpRequest.Timeout = 30000
        $ftpRequest.KeepAlive = $false

        $requestStream = $ftpRequest.GetRequestStream()
        $fileStream.CopyTo($requestStream)
        $requestStream.Close()
        $fileStream.Close()

        $response = $ftpRequest.GetResponse()
        $response.Close()

        $uploadedCount++
        Write-Host "  OK $relPath" -ForegroundColor Green
    }
    catch {
        $errorCount++
        Write-Host "  ERR $relPath - $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DEPLOY COMPLETADO" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Archivos: $uploadedCount OK, $errorCount Errores" -ForegroundColor White
Write-Host "Sitio: https://mlibretools.aigents.com.ar" -ForegroundColor Cyan
Write-Host ""
Write-Host "Presiona Enter para cerrar..." -ForegroundColor Gray
$null = Read-Host
