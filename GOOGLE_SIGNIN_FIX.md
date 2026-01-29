# 🔧 Google Sign-In - NAPRAWA BŁĘDU 400

## ❌ **PROBLEM ZE SCREENSHOTA:**

```
Custom scheme URIs are not allowed for 'WEB' client type
Błąd 400: invalid_request
```

## 🎯 **PRZYCZYNA:**

Kod używał **Web Client ID**, ale React Native wymaga **Android Client ID**!

### Różnica:
- **Web Client ID** (type 3): `432126526994-qf7v8bthqohpvik7s51utjd7io8jin3m...`
  - Używany do OAuth przez przeglądarki web
  - **NIE DZIAŁA** w React Native!
  
- **Android Client ID** (type 1): `432126526994-9oga90chv05380q8t8lu9hnil4m66ljv...`
  - Powiązany z SHA fingerprint: `dd9dc485a95abf625133670499803b55d52e6bbe`
  - **TO TRZEBA UŻYWAĆ** w React Native!

---

## ✅ **NAPRAWA - CO ZMIENIŁEM:**

### Plik: `components/AuthForm.tsx`

**PRZED:**
```typescript
const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
  clientId: '432126526994-qf7v8bthqohpvik7s51utjd7io8jin3m.apps.googleusercontent.com', // ❌ Web Client ID
});
```

**PO:**
```typescript
const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
  androidClientId: '432126526994-9oga90chv05380q8t8lu9hnil4m66ljv.apps.googleusercontent.com', // ✅ Android Client ID
  webClientId: '432126526994-qf7v8bthqohpvik7s51utjd7io8jin3m.apps.googleusercontent.com', // Do backend verification
});
```

---

## 📱 **O SHA FINGERPRINTS:**

### Dlaczego zmienia się SHA przy każdym buildzie?

EAS Build generuje **nowy SHA** dla każdego buildu, chyba że używasz **managed credentials**.

### Rozwiązanie - 2 opcje:

#### **OPCJA 1: Dodaj nowy SHA do Firebase (SZYBKIE)**

1. Po każdym `eas build` EAS generuje nowy SHA
2. Znajdź go w: https://expo.dev/accounts/[your-account]/projects/mendwise/builds
3. Kliknij na build → **"Build credentials"** → skopiuj SHA
4. Dodaj do Firebase Console:
   - https://console.firebase.google.com/project/repairmate-mvp/settings/general
   - **Your apps** → Android app → **Add fingerprint**
   - Wklej SHA → **Save**
5. **Poczekaj 5-10 minut** aż Firebase się zaktualizuje
6. **Pobierz NOWY google-services.json** z Firebase
7. Zastąp oba pliki:
   - `app/google-services.json`
   - `google-services.json` (root)
8. Zbuduj ponownie: `eas build --profile preview --platform android`

#### **OPCJA 2: Użyj stałych credentials (LEPSZE)**

```bash
# To sprawi że SHA będzie zawsze ten sam
eas credentials

# Wybierz:
# - Android
# - Set up a new keystore
# - LUB użyj istniejącego

# Potem każdy build będzie miał ten sam SHA!
```

---

## 🔥 **EMAIL/PASSWORD - "Failed to create account"**

### Możliwe przyczyny:

#### 1. **Firestore Rules blokują zapis**

Sprawdź: https://console.firebase.google.com/project/repairmate-mvp/firestore/rules

**Powinno być:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Kliknij **Publish** jeśli zmieniłeś!

#### 2. **Firebase API Key nie jest poprawny**

Sprawdź w `firebaseConfig.ts`:
```typescript
apiKey: "AIzaSyB-qBkmSRTSWBzebJ7ZfLoYiDtDvxVq4Pk"
```

Porównaj z Firebase Console:
- https://console.firebase.google.com/project/repairmate-mvp/settings/general
- **Your apps** → Web app → **Config**

#### 3. **Network/CORS problem**

Upewnij się że telefon ma internet i może połączyć się z Firebase.

#### 4. **Email już istnieje**

Spróbuj z **nowym emailem** którego nie używałeś wcześniej.

---

## 🔍 **DEBUG - Jak znaleźć prawdziwą przyczynę:**

### Metoda 1: Logi z telefonu

```powershell
# Uruchom monitoring
.\monitor.ps1

# Spróbuj się zarejestrować
# Zobacz dokładny błąd w konsoli
```

### Metoda 2: Dodaj szczegółowe logowanie

Dodaj do `app/(auth)/signup.tsx`:

```typescript
const handleSignUp = async (email: string, password: string) => {
  setError(null);
  // ... validation ...
  setIsLoading(true);
  try {
    console.log('[SignUp] Attempting createUserWithEmailAndPassword...');
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    console.log('[SignUp] User created:', cred.user.uid);
    
    console.log('[SignUp] Creating Firestore document...');
    await upsertUserDoc(cred.user.uid);
    console.log('[SignUp] Success!');
  } catch (e: any) {
    console.error('[SignUp] Error:', e);
    console.error('[SignUp] Error code:', e?.code);
    console.error('[SignUp] Error message:', e?.message);
    
    const code = e?.code as string | undefined;
    const message = code === 'auth/email-already-in-use' 
      ? 'Email already in use' 
      : `Failed to create account: ${e?.message || 'Unknown error'}`;
    setError(message);
    setIsLoading(false);
  }
};
```

---

## ✅ **CHECKLIST PRZED TESTEM:**

### Google Sign-In:
- [x] Zmieniony `AuthForm.tsx` - używa `androidClientId`
- [ ] Nowy build: `eas build --profile preview --platform android`
- [ ] Zainstaluj nowy APK
- [ ] Test Google Sign-In

### Email/Password:
- [ ] Sprawdź Firestore Rules (allow write for authenticated users)
- [ ] Sprawdź czy API Key się zgadza
- [ ] Spróbuj z **nowym emailem** (nie używanym wcześniej)
- [ ] Zobacz logi z ADB podczas rejestracji

---

## 🎯 **NAJPRAWDOPODOBNIEJSZE ROZWIĄZANIE:**

1. **Google Sign-In:** Naprawiłem - używamy teraz Android Client ID
2. **Email/Password:** Sprawdź **Firestore Rules** i spróbuj z **nowym emailem**

---

## 📞 **JEŚLI DALEJ NIE DZIAŁA:**

### Dla Google Sign-In:
1. Zbuduj nowy APK z naprawionym kodem
2. Wyślij mi screenshot z błędu (jeśli nadal jest)

### Dla Email/Password:
1. Uruchom `.\monitor.ps1`
2. Spróbuj się zarejestrować
3. Wyślij mi logi z konsoli - będzie tam dokładny błąd!

---

## 🚀 **NASTĘPNE KROKI:**

```bash
# 1. Zbuduj nowy APK (z naprawionym Google Sign-In)
eas build --profile preview --platform android

# 2. Gdy build się skończy:
# - Zainstaluj APK
# - Spróbuj Google Sign-In (powinno działać!)

# 3. Jeśli Email/Password nie działa:
# - Uruchom monitor.ps1
# - Spróbuj zarejestrować
# - Wyślij logi
```
