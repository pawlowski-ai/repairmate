# ⚡ SUPER SZYBKA INSTRUKCJA - ZOBACZ LOGI CRASHA

## 🎯 3 KROKI DO SUKCESU:

### KROK 1: Zrestartuj PowerShell
Winget zainstalował ADB, ale musisz **zrestartować PowerShell** żeby zadziałało!

**ZAMKNIJ** obecne okno PowerShell i **OTWÓRZ NOWE**.

---

### KROK 2: Uruchom zaktualizowany skrypt

W **NOWYM** oknie PowerShell (w folderze projektu):

```powershell
.\START_ADB_MONITORING.ps1
```

---

### KROK 3: Odtwórz crash

Gdy skrypt pokaże "Monitoruję logi...":

1. **Otwórz aplikację MendWise** na telefonie
2. **Kliknij "Start Now!"**
3. **Obserwuj konsole** - pojawią się logi błędów

**SKOPIUJ WSZYSTKO** co się pojawi i wyślij mi!

---

## 🆘 JEŚLI SKRYPT POKAZUJE "NIE WYKRYTO TELEFONU"

### Sprawdź na telefonie:
1. **Powiadomienia** (rozwiń górną belkę)
2. Znajdź **"USB charging this device"** lub podobne
3. **Kliknij** na to powiadomienie
4. Zmień na **"Transfer files"** lub **"File Transfer"**
5. Uruchom skrypt ponownie

### Sprawdź dialog autoryzacji:
- Na telefonie powinien pojawić się dialog: **"Allow USB debugging?"**
- Zaznacz: **"Always allow from this computer"**
- Kliknij: **OK**

---

## 📱 CO ZOBACZYSZ W LOGACH:

Gdy aplikacja crashuje, w konsoli pojawią się linie typu:

```
FATAL EXCEPTION: main
Process: com.brainiac.repairmate
java.lang.RuntimeException: ...
    at android.app...
    at com.facebook.react...
```

**LUB:**

```
ReactNativeJS: Error: ...
ReactNativeJS: at Object.push...
```

**LUB:**

```
AndroidRuntime: FATAL EXCEPTION
AndroidRuntime: Process: com.brainiac.repairmate
```

---

## 🎯 CO ZROBIĆ Z LOGAMI:

1. **Zaznacz całość** w konsoli PowerShell (kliknij i przeciągnij)
2. **Prawy przycisk → Copy** (lub Ctrl+C)
3. **Wyślij mi** (wklej w wiadomość)

---

## 💡 NAJCZĘSTSZE PROBLEMY:

### "adb nie jest rozpoznawany"
➤ **Zrestartuj PowerShell** (zamknij i otwórz nowe okno)

### "unauthorized"
➤ **Na telefonie** zaakceptuj dialog "Allow USB debugging"

### "no devices"  
➤ **Zmień tryb USB** na telefonie na "Transfer files"
➤ **Spróbuj innego kabla USB** (niektóre tylko ładują)

### "offline"
➤ **Uruchom w PowerShell:**
```powershell
adb kill-server
adb start-server
```

---

## 🚀 TO WSZYSTKO!

Po wykonaniu tych 3 kroków zobaczysz dokładnie co crashuje aplikację! 🎉
