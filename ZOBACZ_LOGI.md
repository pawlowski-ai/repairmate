# 📱 JAK ZOBACZYĆ LOGI CRASHA - INSTRUKCJA KROK PO KROKU

## ⚡ SZYBKA METODA - Użyj gotowego skryptu

Stworzyłem skrypt który zrobi wszystko za Ciebie!

### Krok 1: Uruchom skrypt

W PowerShell (w folderze projektu):

```powershell
.\check_crash.ps1
```

Skrypt automatycznie:
- ✓ Znajdzie ADB
- ✓ Sprawdzi połączenie z telefonem  
- ✓ Wyczyści stare logi
- ✓ Rozpocznie monitoring

### Krok 2: Odtwórz crash

Gdy skrypt będzie działał:
1. **Otwórz aplikację** na telefonie
2. **Kliknij "Start Now!"** w splash screen
3. **Obserwuj logi** w konsoli

### Krok 3: Skopiuj logi

Gdy aplikacja crashuje, w konsoli pojawią się błędy.
**SKOPIUJ WSZYSTKO** i wyślij mi!

---

## 🔧 RĘCZNA METODA (jeśli skrypt nie działa)

### Krok 1: Znajdź gdzie jest ADB

ADB może być w:
- `C:\Program Files\Google\Platform Tools\adb.exe`
- `%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe`
- `C:\platform-tools\adb.exe`

Otwórz folder gdzie zainstalowałeś Platform Tools.

### Krok 2: Otwórz PowerShell w tym folderze

1. W folderze z adb.exe
2. Shift + Prawy przycisk myszy
3. "Otwórz okno PowerShell tutaj"

### Krok 3: Sprawdź połączenie

```powershell
.\adb devices
```

Powinno pokazać:
```
List of devices attached
XXXXXXXXX    device
```

**Jeśli pokazuje "unauthorized":**
- Na telefonie pojawi się dialog "Allow USB debugging?"
- Zaznacz "Always allow from this computer"
- Kliknij OK

**Jeśli nie widzi urządzenia:**
- Sprawdź czy kabel USB jest do transferu danych (nie tylko ładowanie)
- Na telefonie zmień tryb USB na "Transfer files" / "MTP"
- Sprawdź czy USB debugging jest włączony

### Krok 4: Wyczyść stare logi

```powershell
.\adb logcat -c
```

### Krok 5: Uruchom monitoring

```powershell
.\adb logcat | Select-String -Pattern "ReactNativeJS|FATAL|Exception" -CaseSensitive:$false
```

### Krok 6: Odtwórz crash

1. **Otwórz aplikację** na telefonie
2. **Kliknij przycisk** w splash screen
3. **W konsoli pojawią się logi** - SKOPIUJ WSZYSTKO!

---

## 🎯 CZEGO SZUKAĆ W LOGACH

Szukaj linii zawierających:

### ❌ FATAL EXCEPTION
```
FATAL EXCEPTION: main
Process: com.brainiac.repairmate, PID: 12345
```

### ❌ ReactNativeJS Error
```
ReactNativeJS: Error: ...
ReactNativeJS: at ...
```

### ❌ Java/Android Exception
```
java.lang.RuntimeException: Unable to start activity
    at android.app.ActivityThread...
```

### ❌ Firebase Error
```
Firebase: FirebaseApp initialization unsuccessful
```

---

## 📤 CO MI WYSŁAĆ

Skopiuj **CAŁY FRAGMENT** z okolicy błędu:

```
----- 5-10 linii PRZED błędem -----
[INFO] User action...
[DEBUG] Navigating...

----- BŁĄD (NAJWAŻNIEJSZE!) -----
FATAL EXCEPTION: main
Process: com.brainiac.repairmate
java.lang.RuntimeException: ...
    at com.facebook.react...
    at firebase.auth...
    
----- 10-15 linii PO błędzie -----
Caused by: java.lang.IllegalStateException...
    at com.google...
```

---

## 💡 ROZWIĄZYWANIE PROBLEMÓW

### Problem: "adb nie jest rozpoznawany"

**Rozwiązanie A - Dodaj do PATH:**
```powershell
$env:Path += ";C:\Program Files\Google\Platform Tools"
```

**Rozwiązanie B - Użyj pełnej ścieżki:**
```powershell
& "C:\Program Files\Google\Platform Tools\adb.exe" devices
```

### Problem: "no devices found"

**Sprawdź:**
1. Kabel USB - spróbuj innego (niektóre tylko ładują!)
2. Na telefonie: Powiadomienia → USB → Zmień na "Transfer files"
3. Sterowniki USB - zainstaluj sterowniki dla swojego telefonu
4. Spróbuj inny port USB (najlepiej USB 2.0, nie USB-C/3.0)

### Problem: "device offline"

**Rozwiązanie:**
```powershell
.\adb kill-server
.\adb start-server
.\adb devices
```

### Problem: "unauthorized"

**Rozwiązanie:**
1. Odłącz telefon
2. Na telefonie: Settings → Developer Options → Revoke USB debugging authorizations
3. Podłącz ponownie
4. Zaakceptuj dialog na telefonie

---

## 🚀 SUPER SZYBKA METODA (jedna komenda)

Jeśli już masz wszystko skonfigurowane:

```powershell
adb logcat -c; adb logcat *:E | Select-String "repairmate|ReactNative|FATAL"
```

Potem:
1. Otwórz aplikację
2. Kliknij przycisk
3. Skopiuj output
4. Wyślij mi!

---

## 📞 GDY MASZ LOGI

Wyślij mi:
1. **Cały fragment** z błędem (nie tylko jedną linię)
2. **Model telefonu** i wersję Android
3. **Co robiłeś** gdy crashowało

Jak zobaczę błąd, natychmiast go naprawię! 🎯
