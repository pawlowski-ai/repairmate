# 🔧 ROZWIĄZANIE PROBLEMU Z BUILDEM

## ❌ **PROBLEM:**

Build używa STAREGO kodu mimo że zmiany są commitnięte i pushowane!

**Dowód z logów:**
- ❌ Brak logów `[SignUp] Starting registration for:`
- ❌ Google błąd 400 (stary kod używa `clientId` zamiast `androidClientId`)

---

## ✅ **ROZWIĄZANIE - WYCZYŚĆ CACHE I ZBUDUJ PONOWNIE:**

```bash
# Wyczyść cache EAS Build
eas build --profile preview --platform android --clear-cache
```

**WAŻNE:** `--clear-cache` wymusi rebuild wszystkiego od zera!

---

## 🔍 **INNE MOŻLIWE PRZYCZYNY:**

### **1. Redirect URI w Firebase Auth**

Google Sign-In w React Native używa **custom URL scheme**, który MUSI być skonfigurowany w Firebase.

#### **Sprawdź w Firebase Console:**

1. Idź do: https://console.firebase.google.com/project/repairmate-mvp/authentication/providers
2. Kliknij **Google** → **Edit**
3. Sprawdź czy w sekcji **"Authorized domains"** jest:
   - `localhost`
   - `repairmate-mvp.firebaseapp.com`
   - Dodaj też: `auth.expo.io` (dla Expo)

#### **KRYTYCZNE - expo-auth-session wymaga konfiguracji:**

Dla `expo-auth-session` z Google w React Native, trzeba:

1. **W Firebase Console** → **OAuth consent screen**:
   - Upewnij się że app jest published (nie "Testing")
   
2. **W Google Cloud Console**:
   - Idź do: https://console.cloud.google.com/apis/credentials?project=repairmate-mvp
   - Znajdź swój **Android OAuth client**
   - Sprawdź czy ma **Package name**: `com.brainiac.repairmate`
   - Sprawdź czy ma **SHA-1**: `dd9dc485a95abf625133670499803b55d52e6bbe`

---

### **2. expo-auth-session może potrzebować dodatkowej konfiguracji**

Sprawdź `app.json` czy ma:

```json
{
  "expo": {
    "scheme": "repairmate"
  }
}
```

---

## 🚀 **KROK PO KROKU - CO ZROBIĆ TERAZ:**

### **Krok 1: Wyczyść cache i zbuduj**

```bash
eas build --profile preview --platform android --clear-cache
```

Poczekaj na build (~15-20 min pierwszych buildów z --clear-cache trwa dłużej).

### **Krok 2: Sprawdź Firebase Console**

#### **A) Authorized domains:**
https://console.firebase.google.com/project/repairmate-mvp/authentication/settings

Dodaj:
- `auth.expo.io`

#### **B) Google Cloud Console:**
https://console.cloud.google.com/apis/credentials?project=repairmate-mvp

Sprawdź Android OAuth client:
- Package name: `com.brainiac.repairmate` ✅
- SHA-1: `dd9dc485a95abf625133670499803b55d52e6bbe` ✅

#### **C) OAuth consent screen:**
https://console.cloud.google.com/apis/credentials/consent?project=repairmate-mvp

- Status powinien być **"Published"** (nie "Testing")

### **Krok 3: Test**

Po nowym buildzie:
1. Zainstaluj APK
2. Spróbuj Email/Password - powinny być szczegółowe logi!
3. Spróbuj Google Sign-In

---

## 🔍 **JAK SPRAWDZIĆ CZY NOWY BUILD MA NOWE ZMIANY:**

Po zainstalowaniu nowego APK:

```powershell
.\monitor.ps1
```

1. Otwórz aplikację
2. Spróbuj się zarejestrować
3. **Szukaj w logach:**
   ```
   [SignUp] Starting registration for:
   ```

Jeśli to się pojawi = build ma nowe zmiany! ✅  
Jeśli tego nie ma = build dalej używa starego kodu ❌

---

## 📊 **DLACZEGO TO SIĘ DZIEJE:**

### **EAS Build Cache:**

EAS Build cache'uje:
- Dependencies (node_modules)
- Native builds
- Assets

Jeśli cache nie zostanie wyczyszczony, może używać starych plików!

### **Rozwiązanie:**

```bash
--clear-cache  # Wymusza rebuild wszystkiego od zera
```

---

## ⚠️ **JEŚLI `--clear-cache` NIE POMOŻE:**

### **Problem może być w expo-auth-session:**

Błąd "Custom URL scheme is not enabled" może znaczyć że:

1. **Brak scheme w app.json:**
   ```json
   {
     "expo": {
       "scheme": "repairmate",
       "android": {
         "googleServicesFile": "./google-services.json"
       }
     }
   }
   ```

2. **Google OAuth client nie ma redirect URI:**
   - W Google Cloud Console, Android client NIE POTRZEBUJE redirect URI
   - ALE web client potrzebuje!

3. **Może trzeba użyć innego podejścia:**
   - Zamiast `expo-auth-session`, użyć `@react-native-google-signin/google-signin`
   - Albo `expo-google-app-auth` (deprecated ale może działać)

---

## 🆘 **NASTĘPNE KROKI:**

### **Najpierw:**

```bash
eas build --profile preview --platform android --clear-cache
```

### **Potem sprawdź logi:**

```powershell
.\monitor.ps1
```

Szukaj: `[SignUp] Starting registration`

### **Jeśli dalej nie działa:**

Wyślij mi:
1. Logi z nowego buildu
2. Screenshot z Firebase Console → Authentication → Google (settings)
3. Screenshot z Google Cloud Console → OAuth client (settings)

---

## 💡 **DODATKOWY TIP - SDK 53:**

SDK 53 używa:
- React Native 0.76+
- Nowe Expo modules
- Może wymagać `expo-auth-session@~6.2.1` (sprawdź czy masz)

Sprawdź `package.json`:
```json
"expo-auth-session": "~6.2.1"
```

Jeśli nie, zaktualizuj:
```bash
npm install expo-auth-session@~6.2.1
```

Potem:
```bash
eas build --clear-cache
```
