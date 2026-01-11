# MendWise Crash Monitor - Simple ASCII version
# Run this script and then open the app on your phone

Write-Host "=== MendWise Crash Monitor ===" -ForegroundColor Green
Write-Host ""

# Refresh PATH in current session
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

Write-Host "Looking for ADB..." -ForegroundColor Yellow

# Check if ADB is in PATH
$adbCmd = Get-Command adb -ErrorAction SilentlyContinue
if ($adbCmd) {
    $adb = $adbCmd.Source
    Write-Host "Found ADB: $adb" -ForegroundColor Green
} else {
    # Search common winget locations
    $patterns = @(
        "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\Google.PlatformTools_*\platform-tools\adb.exe",
        "$env:LOCALAPPDATA\Microsoft\WinGet\Links\adb.exe"
    )
    
    $adb = $null
    foreach ($pattern in $patterns) {
        $found = Get-Item $pattern -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($found) {
            $adb = $found.FullName
            Write-Host "Found ADB: $adb" -ForegroundColor Green
            break
        }
    }
    
    if (-not $adb) {
        Write-Host "ERROR: ADB not found!" -ForegroundColor Red
        Write-Host "Please close PowerShell and open a NEW window, then try again." -ForegroundColor Yellow
        Read-Host "Press Enter to exit"
        exit 1
    }
}

Write-Host ""
Write-Host "Checking devices..." -ForegroundColor Yellow
$devicesOutput = & $adb devices 2>&1
Write-Host $devicesOutput

if ($devicesOutput -match "unauthorized") {
    Write-Host ""
    Write-Host "WARNING: Device not authorized!" -ForegroundColor Red
    Write-Host "On your phone, accept the USB debugging dialog." -ForegroundColor Yellow
    Write-Host "Check 'Always allow from this computer' and click OK." -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter after authorizing"
    $devicesOutput = & $adb devices 2>&1
    Write-Host $devicesOutput
}

$deviceLines = $devicesOutput | Select-String "\s+device$"
if (-not $deviceLines) {
    Write-Host ""
    Write-Host "ERROR: No device detected!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Make sure:" -ForegroundColor Yellow
    Write-Host "1. Phone is connected via USB" -ForegroundColor White
    Write-Host "2. USB cable supports data transfer (not just charging)" -ForegroundColor White
    Write-Host "3. USB Debugging is enabled on phone" -ForegroundColor White
    Write-Host "4. Phone is in 'Transfer files' mode (check USB notification)" -ForegroundColor White
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "SUCCESS: Phone detected!" -ForegroundColor Green
Write-Host ""
Write-Host "Clearing old logs..." -ForegroundColor Yellow
& $adb logcat -c
Start-Sleep -Milliseconds 500
Write-Host "Done!" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  NOW OPEN THE APP AND CLICK THE BUTTON" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Monitoring logs... (Press Ctrl+C to stop)" -ForegroundColor Green
Write-Host ""
Write-Host "--- LOGS START ---" -ForegroundColor DarkGray
Write-Host ""

& $adb logcat -v time | Select-String -Pattern "repairmate|mendwise|ReactNative|FATAL|AndroidRuntime|crash|firebase|Exception" -CaseSensitive:$false
