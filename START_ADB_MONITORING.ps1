# Zaktualizowany skrypt - działa po instalacji winget
# Uruchom w NOWYM oknie PowerShell!

Write-Host "=== MendWise Crash Debugger v2 ===" -ForegroundColor Green
Write-Host ""

# Odśwież PATH w bieżącej sesji (bez restartowania PowerShell)
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

Write-Host "Szukam ADB..." -ForegroundColor Yellow

# Sprawdź czy ADB jest w PATH po odświeżeniu
$adbCmd = Get-Command adb -ErrorAction SilentlyContinue
if ($adbCmd) {
    $adb = $adbCmd.Source
    Write-Host "✓ Znaleziono ADB w PATH: $adb" -ForegroundColor Green
} else {
    # Szukaj w typowych lokalizacjach winget
    $wingetPaths = @(
        "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\Google.PlatformTools_*\platform-tools\adb.exe",
        "$env:LOCALAPPDATA\Microsoft\WinGet\Links\adb.exe",
        "$env:ProgramFiles\Google\Platform Tools\adb.exe",
        "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
    )
    
    $adb = $null
    foreach ($pattern in $wingetPaths) {
        $found = Get-Item $pattern -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($found) {
            $adb = $found.FullName
            Write-Host "✓ Znaleziono ADB: $adb" -ForegroundColor Green
            break
        }
    }
    
    if (-not $adb) {
        Write-Host "✗ Nie znaleziono ADB!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Spróbuj:" -ForegroundColor Yellow
        Write-Host "1. Zamknij to okno PowerShell" -ForegroundColor White
        Write-Host "2. Otwórz NOWE okno PowerShell" -ForegroundColor White
        Write-Host "3. Uruchom ponownie ten skrypt" -ForegroundColor White
        Write-Host ""
        Read-Host "Naciśnij Enter aby zamknąć"
        exit 1
    }
}

Write-Host ""

# Sprawdź urządzenia
Write-Host "Sprawdzam podłączone urządzenia..." -ForegroundColor Yellow
Write-Host ""

$devicesOutput = & $adb devices 2>&1
Write-Host $devicesOutput

# Sprawdź czy są urządzenia
if ($devicesOutput -match "unauthorized") {
    Write-Host ""
    Write-Host "⚠️  URZĄDZENIE NIE AUTORYZOWANE!" -ForegroundColor Red
    Write-Host ""
    Write-Host "NA TELEFONIE POWINIEN POJAWIĆ SIĘ DIALOG:" -ForegroundColor Yellow
    Write-Host "'Allow USB debugging from this computer?'" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "✓ Zaznacz: 'Always allow from this computer'" -ForegroundColor Green
    Write-Host "✓ Kliknij: OK" -ForegroundColor Green
    Write-Host ""
    Read-Host "Naciśnij Enter gdy autoryzujesz (pojawi się na telefonie)"
    
    $devicesOutput = & $adb devices 2>&1
    Write-Host $devicesOutput
}

# Policz urządzenia (linie kończące się na 'device')
$deviceLines = $devicesOutput | Select-String "\s+device$"
if (-not $deviceLines) {
    Write-Host ""
    Write-Host "✗ NIE WYKRYTO TELEFONU!" -ForegroundColor Red
    Write-Host ""
    Write-Host "SPRAWDŹ CZY:" -ForegroundColor Yellow
    Write-Host "1. ✓ Telefon jest podłączony przez USB" -ForegroundColor White
    Write-Host "2. ✓ Kabel USB jest do TRANSFERU DANYCH (nie tylko ładowania)" -ForegroundColor White
    Write-Host "3. ✓ USB Debugging jest włączony (Settings → Developer Options)" -ForegroundColor White
    Write-Host "4. ✓ Na telefonie w powiadomieniach: USB → 'Transfer files' (nie 'Charging only')" -ForegroundColor White
    Write-Host ""
    Write-Host "JEŚLI DALEJ NIE DZIAŁA:" -ForegroundColor Yellow
    Write-Host "- Spróbuj innego kabla USB" -ForegroundColor White
    Write-Host "- Spróbuj innego portu USB na komputerze" -ForegroundColor White
    Write-Host "- Odinstaluj i zainstaluj ponownie sterowniki USB telefonu" -ForegroundColor White
    Write-Host ""
    Read-Host "Naciśnij Enter aby zamknąć"
    exit 1
}

Write-Host ""
Write-Host "✓ ✓ ✓ TELEFON WYKRYTY! ✓ ✓ ✓" -ForegroundColor Green
Write-Host ""

# Wyczyść stare logi
Write-Host "Czyszczę stare logi..." -ForegroundColor Yellow
& $adb logcat -c
Start-Sleep -Milliseconds 500
Write-Host "✓ Gotowe!" -ForegroundColor Green
Write-Host ""

Write-Host "================================" -ForegroundColor Cyan
Write-Host "      TERAZ ODTWÓRZ CRASH:" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. ➤ Otwórz aplikację MendWise na telefonie" -ForegroundColor White
Write-Host "2. ➤ Kliknij przycisk 'Start Now!' w splash screen" -ForegroundColor White  
Write-Host "3. ➤ Obserwuj logi poniżej..." -ForegroundColor White
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚡ Monitoruję logi... (Ctrl+C aby zatrzymać)" -ForegroundColor Green
Write-Host ""
Write-Host "--- LOGI START ---" -ForegroundColor DarkGray
Write-Host ""

# Monitoruj logi - pokazuj WSZYSTKO z naszej aplikacji + błędy
& $adb logcat -v time | Select-String -Pattern "repairmate|mendwise|ReactNative|FATAL|AndroidRuntime|crash|firebase" -CaseSensitive:$false

Write-Host ""
Write-Host "--- LOGI KONIEC ---" -ForegroundColor DarkGray
