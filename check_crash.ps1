# Script do sprawdzania crash logów z telefonu Android
# Użyj: .\check_crash.ps1

Write-Host "=== MendWise Crash Debugger ===" -ForegroundColor Green
Write-Host ""

# Szukaj ADB w różnych lokalizacjach
$adbPaths = @(
    "C:\Program Files\Google\Platform Tools\adb.exe",
    "C:\Program Files (x86)\Google\Platform Tools\adb.exe",
    "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe",
    "$env:USERPROFILE\AppData\Local\Android\Sdk\platform-tools\adb.exe",
    "C:\platform-tools\adb.exe",
    "adb.exe"  # Try PATH
)

$adb = $null
foreach ($path in $adbPaths) {
    if (Test-Path $path -ErrorAction SilentlyContinue) {
        $adb = $path
        Write-Host "✓ Znaleziono ADB: $adb" -ForegroundColor Green
        break
    }
}

if (-not $adb) {
    # Try to find it using Get-Command
    $adbCmd = Get-Command adb -ErrorAction SilentlyContinue
    if ($adbCmd) {
        $adb = $adbCmd.Source
        Write-Host "✓ Znaleziono ADB: $adb" -ForegroundColor Green
    }
}

if (-not $adb) {
    Write-Host "✗ Nie znaleziono ADB!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Pobierz Platform Tools z:" -ForegroundColor Yellow
    Write-Host "https://developer.android.com/tools/releases/platform-tools" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "LUB zainstaluj przez:" -ForegroundColor Yellow
    Write-Host "winget install Google.PlatformTools" -ForegroundColor Cyan
    Write-Host ""
    Read-Host "Naciśnij Enter aby zamknąć"
    exit 1
}

Write-Host ""

# Sprawdź urządzenia
Write-Host "Sprawdzam podłączone urządzenia..." -ForegroundColor Yellow
$devices = & $adb devices

if ($devices -match "unauthorized") {
    Write-Host "✗ Urządzenie nie autoryzowane!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Na telefonie powinien pojawić się dialog:" -ForegroundColor Yellow
    Write-Host "'Allow USB debugging?'" -ForegroundColor Cyan
    Write-Host "Zaznacz 'Always allow' i kliknij OK" -ForegroundColor Cyan
    Write-Host ""
    Read-Host "Naciśnij Enter gdy autoryzujesz urządzenie"
    $devices = & $adb devices
}

$deviceCount = ($devices | Select-String "device$" | Measure-Object).Count
if ($deviceCount -eq 0) {
    Write-Host "✗ Nie wykryto urządzeń!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Sprawdź czy:" -ForegroundColor Yellow
    Write-Host "1. Telefon jest podłączony przez USB" -ForegroundColor White
    Write-Host "2. USB debugging jest włączony w Opcjach programisty" -ForegroundColor White
    Write-Host "3. Używasz kabla 'data', nie tylko do ładowania" -ForegroundColor White
    Write-Host "4. Na telefonie wybrałeś 'Transfer files' (nie tylko ładowanie)" -ForegroundColor White
    Write-Host ""
    Read-Host "Naciśnij Enter aby zamknąć"
    exit 1
}

Write-Host "✓ Wykryto urządzenie!" -ForegroundColor Green
Write-Host ""

# Wyczyść stare logi
Write-Host "Czyszczę stare logi..." -ForegroundColor Yellow
& $adb logcat -c
Write-Host "✓ Gotowe!" -ForegroundColor Green
Write-Host ""

Write-Host "================================" -ForegroundColor Cyan
Write-Host "TERAZ:" -ForegroundColor Yellow
Write-Host "1. Otwórz aplikację MendWise na telefonie" -ForegroundColor White
Write-Host "2. Kliknij przycisk 'Start Now!' na splash screen" -ForegroundColor White
Write-Host "3. Obserwuj logi poniżej..." -ForegroundColor White
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Monitoruję logi... (Naciśnij Ctrl+C aby zatrzymać)" -ForegroundColor Green
Write-Host ""

# Monitoruj logi z filtrami dla crash
& $adb logcat | Select-String -Pattern "ReactNativeJS|FATAL|crash|Exception|Error|mendwise|repairmate" -CaseSensitive:$false
