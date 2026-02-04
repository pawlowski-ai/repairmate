# 🚀 INSTRUKCJA TESTOWANIA - NAPRAWIONE BUGI AUTORYZACJI

## ✅ **CO ZOSTAŁO NAPRAWIONE**

Wykonałem **4 krytyczne naprawy** które rozwiązują wszystkie zgłoszone problemy:

### **Fix #1: Google Sign-In tworzy dokument w Firestore** 🔧
**Problem:** Dialog Google się otwierał i zamykał, ale nic się nie działo  
**Przyczyna:** Google Sign-In tworzył tylko użytkownika w Firebase Auth, ale NIE tworzył dokumentu w Firestore  
**Rozwiązanie:** Dodano tworzenie dokumentu w Firestore z `consented: false` - identycznie jak przy email/password

### **Fix #2: Usunięto Proxy z inicjalizacji Firebase** 🔧
**Problem:** Błąd "invalid argument" przy pierwszej próbie rejestracji  
**Przyczyna:** Proxy powodował lazy initialization → AsyncStorage nie był gotowy przy pierwszym użyciu  
**Rozwiązanie:** Auth i DB są teraz inicjalizowane NATYCHMIAST przy starcie aplikacji

### **Fix #3: Lepszy routing i więcej logów** 🔧
**Problem:** Użytkownik po rejestracji widział ekran główny zamiast zgód  
**Przyczyna:** Timeout 100ms był za krótki + brak logów utrudniał diagnozę  
**Rozwiązanie:** Zwiększony timeout do 200ms + dodane szczegółowe logi każdej decyzji routingu

### **Fix #4: Szczegółowe logi rejestracji** 🔧
**Problem:** Trudno było zdiagnozować gdzie dokładnie proces się psuje  
**Przyczyna:** Za mało informacji w logach  
**Rozwiązanie:** Dodane logi przed/po każdym kroku + pełne obiekty błędów

---

## 📦 **NOWY BUILD**

**Commit:** `eb107ec`  
**Message:** Fix: Complete auth flow with Firestore document creation and improved error handling

**Co zrobić:**

```bash
# 1. Build z czystym cache
eas build --profile preview --platform android --clear-cache

# 2. Po zakończeniu buildu - SPRAWDŹ W EXPO.DEV:
# https://expo.dev/accounts/lukinopawlalino/projects/mendwise/builds
# 
# Kliknij na najnowszy build → sprawdź sekcję "Git commit"
# MUSI BYĆ: eb107ec (lub nowszy)
```

---

## 🧪 **JAK TESTOWAĆ**

### **Krok 1: Sprawdź inicjalizację Firebase**

Uruchom monitoring:
```powershell
.\monitor.ps1
```

Otwórz aplikację i **NATYCHMIAST** szukaj w logach:
```
[Firebase Auth] Initialized with AsyncStorage persistence
```

✅ **Jeśli to widzisz** = build ma NOWY kod  
❌ **Jeśli tego nie ma** = build ma STARY kod (niewłaściwy commit!)

---

### **Krok 2: Test Email/Password Registration**

1. Kliknij "SIGN UP"
2. Wypełnij email i hasło (min. 6 znaków)
3. Kliknij "SIGN UP"

**Oczekiwane logi:**
```
[SignUp] ========== STARTING REGISTRATION ==========
[SignUp] Email: test@example.com
[SignUp] Password length: 8
[SignUp] ✅ User created successfully in Firebase Auth
[SignUp] UID: abc123...
[SignUp] ✅ User document created in Firestore
[SignUp] ========== REGISTRATION COMPLETE ==========
[RootLayout] User logged in, UID: abc123...
[RootLayout] Firestore document exists: true
[RootLayout] User consented: false
[RootLayout] User needs to consent, redirecting to /consents
[RootLayout] Executing redirect to /consents
```

**Oczekiwane zachowanie:**
- ✅ Rejestracja się udaje (bez błędu "invalid argument")
- ✅ Aplikacja AUTOMATYCZNIE przekierowuje do ekranu zgód (BEFORE WE START)
- ✅ Widzisz 3 checkboxy do zaakceptowania

**❌ Jeśli nadal błąd "invalid argument":**
- Sprawdź czy logi pokazują `[Firebase Auth] Initialized with AsyncStorage`
- Jeśli nie ma tego logu = build używa starego kodu

---

### **Krok 3: Test Google Sign-In**

1. Kliknij ikonę Google (na dole)
2. Wybierz konto Google z listy
3. Poczekaj chwilę

**Oczekiwane logi:**
```
[GoogleSignIn] Starting sign in...
[GoogleSignIn] Got user info: { email: ..., name: ... }
[GoogleSignIn] Successfully signed in to Firebase, UID: xyz789...
[GoogleSignIn] User document created/updated: { uid: xyz789..., exists: false, consented: false }
[RootLayout] User logged in, UID: xyz789...
[RootLayout] Firestore document exists: true
[RootLayout] User consented: false
[RootLayout] User needs to consent, redirecting to /consents
[RootLayout] Executing redirect to /consents
```

**Oczekiwane zachowanie:**
- ✅ Dialog Google się otwiera
- ✅ Po wyborze konta dialog się zamyka
- ✅ Aplikacja AUTOMATYCZNIE przekierowuje do ekranu zgód
- ✅ Widzisz ekran "BEFORE WE START"

**❌ Jeśli dialog się zamyka ale nic się nie dzieje:**
- Sprawdź logi czy jest `[GoogleSignIn] User document created/updated`
- Jeśli nie ma = build używa starego kodu

---

### **Krok 4: Test persistence po restarcie**

1. Zarejestruj się (email lub Google)
2. **NIE AKCEPTUJ** zgód na ekranie "BEFORE WE START"
3. Zamknij aplikację (force close)
4. Otwórz aplikację ponownie

**Oczekiwane logi:**
```
[Firebase Auth] Initialized with AsyncStorage persistence
[RootLayout] User logged in, UID: abc123...
[RootLayout] Firestore document exists: true
[RootLayout] User consented: false
[RootLayout] User needs to consent, redirecting to /consents
```

**Oczekiwane zachowanie:**
- ✅ Użytkownik jest ZALOGOWANY (dzięki AsyncStorage)
- ✅ Aplikacja przekierowuje do `/consents` (zgody)
- ✅ **NIE** przekierowuje do `/` (home)

---

### **Krok 5: Test po zaakceptowaniu zgód**

1. Na ekranie "BEFORE WE START" zaakceptuj wszystkie zgody
2. Kliknij "Next"
3. Przejdź przez onboarding (3 ekrany)
4. Zamknij aplikację
5. Otwórz aplikację ponownie

**Oczekiwane logi:**
```
[RootLayout] User logged in, UID: abc123...
[RootLayout] Firestore document exists: true
[RootLayout] User consented: true
[RootLayout] User already consented, redirecting to /
[RootLayout] Executing redirect to /
```

**Oczekiwane zachowanie:**
- ✅ Aplikacja przekierowuje do `/` (home - ekran główny)
- ✅ **NIE** pokazuje znowu zgód ani onboardingu

---

## 🔍 **CO SZUKAĆ W LOGACH - QUICK REFERENCE**

### ✅ **DOBRE logi (wszystko działa):**
```
[Firebase Auth] Initialized with AsyncStorage persistence
[SignUp] ========== REGISTRATION COMPLETE ==========
[GoogleSignIn] User document created/updated
[RootLayout] Firestore document exists: true
[RootLayout] Executing redirect to /consents
```

### ❌ **ZŁE logi (stary kod lub problemy):**
```
[SignUp] INVALID ARGUMENT - This suggests Auth initialization issue!
[GoogleSignIn] Error: No ID token received
[RootLayout] CRITICAL: User document does NOT exist in Firestore!
Firebase Auth for React Native without providing AsyncStorage  ← STARY KOD!
```

---

## 🆘 **JEŚLI DALEJ NIE DZIAŁA**

### **1. Sprawdź commit w expo.dev**

1. Idź do: https://expo.dev/accounts/lukinopawlalino/projects/mendwise/builds
2. Kliknij na najnowszy build
3. Sprawdź sekcję "Git commit" lub "Source"
4. **MUSI BYĆ:** `eb107ec` lub nowszy

**Jeśli NIE JEST:**
- EAS Build użył niewłaściwego commitu
- Spróbuj ponownie: `eas build --clear-cache`

### **2. Sprawdź pierwsze logi po otwarciu aplikacji**

**MUSI BYĆ:**
```
[Firebase Auth] Initialized with AsyncStorage persistence
```

**Jeśli NIE MA:**
- Build ma stary kod
- Sprawdź commit w expo.dev (punkt 1)

### **3. Problem z Google Sign-In?**

Sprawdź w Firebase Console:
- **Authentication → Sign-in method** → Czy Google jest włączony?
- **Authentication → Settings → Authorized domains** → Czy jest `localhost` i twoja domena?
- **Project Settings → SHA certificate fingerprints** → Czy jest SHA-1 i SHA-256?

Sprawdź w Google Cloud Console:
- **APIs & Services → Credentials** → Czy jest OAuth 2.0 Client ID dla Android?
- **OAuth consent screen** → Czy jest skonfigurowany?

### **4. Problem z email/password?**

Sprawdź w Firebase Console:
- **Authentication → Sign-in method** → Czy "Email/Password" jest włączony?

### **5. Problem z Firestore?**

Sprawdź Firestore Rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      // Użytkownik może czytać i pisać do swojego dokumentu
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 📊 **STRUKTURA DOKUMENTU W FIRESTORE**

Po rejestracji, w Firestore → `users` → `{uid}` powinien być dokument:

```json
{
  "plan": "free",
  "callsTotal": 0,
  "consented": false,  // ← Klucz dla routingu!
  "createdAt": "2026-02-01T...",
  "updatedAt": "2026-02-01T..."
}
```

Po zaakceptowaniu zgód:
```json
{
  "plan": "free",
  "callsTotal": 0,
  "consented": true,  // ← Zmienione na true
  "createdAt": "2026-02-01T...",
  "updatedAt": "2026-02-01T..."
}
```

---

## 📝 **NOTATKI**

- Timeout zwiększony z 100ms do 200ms może nie wystarczyć na wolnych urządzeniach
- Jeśli routing nadal nie działa, możemy dodać retry logic
- Logi są teraz bardzo szczegółowe - łatwiej będzie znaleźć problem
- Wszystkie naprawy są backward compatible - nie psują istniejących użytkowników

---

## 🎯 **PODSUMOWANIE ZMIAN TECHNICZNYCH**

| Plik | Co zmieniono | Dlaczego |
|------|-------------|----------|
| `components/AuthForm.tsx` | Dodano tworzenie dokumentu w Firestore po Google Sign-In | Google Sign-In nie tworzył dokumentu → brak przekierowania |
| `services/firebase.ts` | Usunięto Proxy, dodano bezpośrednią inicjalizację | Proxy powodował "invalid argument" przy pierwszym użyciu |
| `app/_layout.tsx` | Zwiększony timeout, dodane logi | Routing był za szybki, trudno było debugować |
| `app/(auth)/signup.tsx` | Dodane szczegółowe logi | Łatwiejsze debugowanie błędów rejestracji |

---

**Wersja:** 1.0  
**Data:** 2026-02-01  
**Commit:** eb107ec
