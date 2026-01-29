# 🔥 Firebase Setup Checklist - KROK PO KROKU

## ✅ **KROK 1: Sprawdź Firebase Console - Authentication**

### Przejdź do Firebase Console:
https://console.firebase.google.com/project/repairmate-mvp/authentication

### Sprawdź czy włączone są metody logowania:

#### 1. Email/Password:
- [ ] Idź do: **Authentication → Sign-in method**
- [ ] Znajdź **Email/Password**
- [ ] **Status musi być: ENABLED** (włączony)
- [ ] Jeśli nie jest włączony:
  - Kliknij na **Email/Password**
  - Przełącz pierwszy switch na **Enable**
  - Kliknij **Save**

#### 2. Google Sign-In:
- [ ] W **Sign-in method** znajdź **Google**
- [ ] **Status musi być: ENABLED**
- [ ] Jeśli nie jest włączony:
  - Kliknij na **Google**
  - Przełącz switch na **Enable**
  - **WAŻNE:** Wybierz Project support email (twój email)
  - Kliknij **Save**

---

## ✅ **KROK 2: Sprawdź Web Client ID**

### W Firebase Console:
1. Idź do: **Authentication → Sign-in method → Google**
2. Kliknij **Web SDK configuration**
3. Skopiuj **Web client ID**
4. Powinno być: `432126526994-qf7v8bthqohpvik7s51utjd7io8jin3m.apps.googleusercontent.com`

### Sprawdź w kodzie:
Plik `components/AuthForm.tsx` linia 30 ma:
```typescript
clientId: '432126526994-qf7v8bthqohpvik7s51utjd7io8jin3m.apps.googleusercontent.com',
```

✓ To się zgadza z google_original.json linia 33!

---

## ✅ **KROK 3: Sprawdź SHA Fingerprints**

### Przejdź do:
https://console.firebase.google.com/project/repairmate-mvp/settings/general

### W sekcji "Your apps" → Android app:

Sprawdź czy są dodane SHA fingerprints:
- [ ] `dd9dc485a95abf625133670499803b55d52e6bbe` (z google_original.json)
- [ ] `96630869f33144b3bc994a6e13fb57e0e83e3208` (z google_original.json)

Jeśli nie ma wszystkich:
1. Kliknij **Add fingerprint**
2. Wklej SHA
3. Kliknij **Save**

### Jak znaleźć swoje SHA (jeśli potrzebujesz więcej):
```bash
# Debug keystore (dla development)
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

# Release keystore (dla EAS build)
# SHA jest w EAS credentials
```

---

## ✅ **KROK 4: Sprawdź Authorized Domains**

### W Firebase Console:
1. Idź do: **Authentication → Settings → Authorized domains**
2. Upewnij się że są dodane:
   - [ ] `repairmate-mvp.firebaseapp.com`
   - [ ] `localhost` (dla testów)

---

## ✅ **KROK 5: Sprawdź Firestore Rules**

### Przejdź do:
https://console.firebase.google.com/project/repairmate-mvp/firestore/rules

### Rules powinny wyglądać tak:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - user can read/write their own document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow all authenticated users to read/write (adjust as needed)
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Kliknij **Publish** jeśli zmieniłeś.

---

## ✅ **KROK 6: Zweryfikuj pliki w projekcie**

### Sprawdź czy zaktualizowane:
- [x] `app/google-services.json` - ZAKTUALIZOWANY (ma OAuth clients)
- [x] `google-services.json` w root - ZAKTUALIZOWANY
- [x] `components/AuthForm.tsx` - Web Client ID się zgadza

---

## ✅ **KROK 7: Zbuduj nowy APK**

```bash
# Usuń poprzednią wersję
eas build:cancel

# Zbuduj nowy
eas build --profile preview --platform android
```

---

## 🐛 **DEBUG: Jeśli dalej nie działa**

### Email/Password błąd "Failed to create account":

1. **Sprawdź w Firebase Console:**
   - Authentication → Users → czy użytkownik został utworzony?
   
2. **Sprawdź logi w ADB:**
   ```bash
   adb logcat | findstr "firebase\|auth\|Exception"
   ```

3. **Możliwe przyczyny:**
   - Email/Password nie jest włączony w Firebase Console
   - Firestore rules blokują zapis do `/users/{uid}`
   - Network problem - sprawdź czy telefon ma internet

### Google Sign-In błąd 400: invalid_request:

1. **Sprawdź Web Client ID:**
   - Czy `AuthForm.tsx` ma poprawny Web Client ID?
   - Czy ten Client ID istnieje w Firebase Console → Credentials?

2. **Sprawdź SHA fingerprints:**
   - Muszą być dodane dla APK który testujesz
   - Debug i Release mają różne SHA!

3. **Sprawdź redirect URIs:**
   - Firebase Console → Authentication → Google → Web SDK configuration
   - Authorized redirect URIs musi mieć: `https://repairmate-mvp.firebaseapp.com/__/auth/handler`

---

## 📱 **TESTOWANIE:**

### Test 1: Email/Password
1. Wpisz email: `test@example.com`
2. Wpisz hasło: `test123` (min 6 znaków)
3. Kliknij **SIGN UP**
4. Sprawdź Firebase Console → Authentication → Users

### Test 2: Google Sign-In
1. Kliknij ikonę Google
2. Wybierz konto Google
3. Zaakceptuj permissions
4. Sprawdź Firebase Console → Authentication → Users

---

## ✅ **CHECKLIST PRZED BUILDEM:**

- [ ] Firebase Authentication Email/Password: **ENABLED**
- [ ] Firebase Authentication Google: **ENABLED** with support email
- [ ] SHA fingerprints dodane (oba z google_original.json)
- [ ] google-services.json zaktualizowany (ma oauth_client)
- [ ] Firestore rules opublikowane
- [ ] Web Client ID w AuthForm.tsx jest poprawny

---

## 🆘 **JEŚLI WSZYSTKO SPRAWDZONE A DALEJ NIE DZIAŁA:**

Wyślij mi:
1. Screenshot z Firebase Console → Authentication → Sign-in method
2. Logi z ADB podczas próby rejestracji:
   ```bash
   adb logcat | findstr "auth\|firebase\|Exception" > auth_logs.txt
   ```
3. Czy w Firebase Console → Authentication → Users pojawia się użytkownik?
