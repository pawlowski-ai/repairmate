# Google Sign-In - Rozwiązanie problemu DEVELOPER_ERROR code 10

## 📋 Podsumowanie problemu

**Główny błąd:** `DEVELOPER_ERROR code 10` przy próbie logowania przez Google Sign-In w aplikacji React Native (Expo) z Firebase Authentication.

**Objawy:**
- Okno wyboru konta Google otwierało się, ale po wybraniu konta zamykało się bez rejestracji
- Później nawet okno wyboru konta przestało się otwierać
- Rejestracja email/password działała poprawnie
- Logi pokazywały: `[GoogleSignIn] Error code: 10` oraz `[GoogleSignIn] Error: DEVELOPER_ERROR`

---

## 🔍 Proces debugowania

### 1. Sprawdzenie podstawowej konfiguracji
- ✅ Firebase Authentication - Google provider włączony
- ✅ `webClientId` w kodzie poprawny (typ Web, nie Android)
- ✅ Package name: `com.brainiac.repairmate` 
- ✅ Plugin `@react-native-google-signin/google-signin` dodany do `app.json`

### 2. Weryfikacja SHA-1 fingerprints
**Problem:** SHA-1 z keystore nie był zsynchronizowany między:
- EAS Credentials (Expo)
- Firebase Console
- Google Cloud Console
- Plik `google-services.json` w projekcie

**Odkrycie:**
```bash
eas credentials
```
Pokazywało: `SHA1 Fingerprint: 5D:C7:C7:14:D3:C6:75:43:41:7B:52:98:96:4E:BB:83:E9:2F:1F:20`

Ten SHA-1 musiał być dodany do:
1. Firebase Console → Project Settings → Your apps → Android app → SHA certificate fingerprints
2. Google Cloud Console automatycznie tworzy Android OAuth Client z tym SHA-1
3. Pobranie zaktualizowanego `google-services.json` z Firebase Console

### 3. Poprawki w kodzie

#### a) `services/firebase.ts`
**Problem:** Lazy initialization z `Proxy` powodowała problemy z `AsyncStorage` persistence.

**Rozwiązanie:** Bezpośrednia inicjalizacja
```typescript
const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
export const db = getFirestore(app);
```

#### b) `components/AuthForm.tsx`
**Problem 1:** Brak tworzenia dokumentu użytkownika w Firestore po Google Sign-In.

**Rozwiązanie:** Dodanie logiki tworzenia/aktualizacji dokumentu po `signInWithCredential`.

**Problem 2:** Niepoprawna struktura danych z `GoogleSignin.signIn()`.

**Rozwiązanie:** Zmiana z `userInfo.idToken` na `response.data.idToken`
```typescript
const response = await GoogleSignin.signIn();
if (!response || response.type !== 'success') {
  throw new Error(`Google Sign-In failed with type: ${response?.type || 'undefined'}`);
}
const userInfo = response.data;
const credential = GoogleAuthProvider.credential(userInfo.idToken);
```

**Problem 3:** Brak `scopes` w konfiguracji.

**Rozwiązanie:** Dodanie scopes do `GoogleSignin.configure()`
```typescript
GoogleSignin.configure({
  webClientId: '432126526994-qf7v8bthqohpvik7s51utjd7io8jin3m.apps.googleusercontent.com',
  offlineAccess: false,
  scopes: ['profile', 'email'],
});
```

### 4. Konfiguracja Google Cloud Console

#### OAuth Consent Screen
- **Publishing status:** Testing (nie Production!)
- **Test users:** Dodanie emaili użytkowników testowych (np. `opele06@gmail.com`)

#### APIs włączone
- ✅ Google+ API (`https://console.cloud.google.com/apis/library/plus.googleapis.com`)
- ✅ Identity Toolkit API (automatycznie dla Firebase)

#### OAuth 2.0 Client IDs
Wymagane **OBA** typy:
1. **Web Application** - webClientId używany w kodzie
2. **Android** - z SHA-1 fingerprint z keystore

---

## ✅ OSTATECZNE ROZWIĄZANIE

### Co było głównym problemem?

**EAS Credentials generowało nowe SHA-1 przy każdym buildzie**, które nie było nigdzie zarejestrowane!

### Rozwiązanie krok po kroku:

1. **Sprawdzenie aktualnego SHA-1 w EAS:**
   ```bash
   eas credentials
   ```
   Wybierz: Android → Keystore → View details

2. **Dodanie SHA-1 do Firebase Console:**
   - Firebase Console → Project Settings → General
   - Scroll down do "Your apps" → Android app
   - Dodaj SHA-1 w sekcji "SHA certificate fingerprints"

3. **Weryfikacja w Google Cloud Console:**
   - https://console.cloud.google.com/apis/credentials
   - Sprawdź czy pojawił się nowy Android OAuth Client z tym SHA-1

4. **Pobranie zaktualizowanego `google-services.json`:**
   - Firebase Console → Project Settings → General
   - W sekcji Android app kliknij "Download google-services.json"
   - **WAŻNE:** Nadpisz stary plik w projekcie!

5. **Commit zmian i nowy build:**
   ```bash
   git add google-services.json
   git commit -m "Update google-services.json with correct SHA-1"
   eas build --platform android --profile preview --clear-cache
   ```

6. **Instalacja i test:**
   - Zainstaluj nowy APK
   - Test Google Sign-In

---

## 📝 Pliki zmodyfikowane w projekcie

### Commity w kolejności:
1. `a35870f` - Fix AsyncStorage persistence
2. `eb107ec` - Fix auth flow with Firestore document creation
3. `710a601` - Add detailed logging for debugging
4. `31a487f` - Add Google Sign-In plugin to app.json
5. `564b2f1` - Fix Google Sign-In response data structure
6. `a6800fc` - Update google-services.json with keystore SHA-1
7. `5615348` - Add scopes to GoogleSignin configuration

### Kluczowe pliki:
- `services/firebase.ts` - Inicjalizacja Firebase
- `components/AuthForm.tsx` - Google Sign-In logic
- `app/_layout.tsx` - Routing po autentykacji
- `google-services.json` - Konfiguracja Firebase dla Androida
- `app.json` - Plugin Expo

---

## 🎯 Najważniejsze wnioski

### 1. `DEVELOPER_ERROR code 10` zawsze oznacza:
Problem z synchronizacją SHA-1 fingerprints między:
- Keystore aplikacji
- Firebase Console
- Google Cloud Console
- Plik `google-services.json`

### 2. EAS Build i SHA-1:
- EAS zarządza keystore automatycznie
- SHA-1 może się zmieniać między buildami (jeśli nie ma stałego keystore)
- **ZAWSZE** sprawdzaj `eas credentials` aby zobaczyć aktualny SHA-1

### 3. `google-services.json` nie jest statyczny:
- Po dodaniu SHA-1 w Firebase, plik się zmienia
- Trzeba go pobrać na nowo i commitować
- Build bez zaktualizowanego pliku będzie rzucał `DEVELOPER_ERROR code 10`

### 4. Wymagania dla Google Sign-In:
- **OBA** OAuth Clients: Web + Android
- `webClientId` w kodzie musi być typu Web (client_type: 3)
- Android client musi mieć SHA-1 z keystore
- OAuth Consent Screen w trybie "Testing" z dodanymi test users
- Włączone Google+ API w Google Cloud Console

### 5. Debugowanie:
```bash
# Sprawdź aktualny SHA-1
eas credentials

# Zbuduj z czystym cache
eas build --platform android --profile preview --clear-cache

# Sprawdź logi w czasie rzeczywistym
# (w aplikacji używamy console.log z prefiksem [GoogleSignIn])
```

---

## 🔧 Narzędzia diagnostyczne

### Configuration Doctor (wymaga subskrypcji $89):
```bash
npx @react-native-google-signin/config-doctor
```

### Alternatywa - manualne sprawdzenie:
1. Porównaj SHA-1 z `eas credentials` vs `google-services.json`
2. Sprawdź czy Web Client ID w kodzie = client_type 3 w `google-services.json`
3. Sprawdź czy package name w `app.json` = package name w Firebase
4. Sprawdź logi dla dokładnych błędów

---

## 📚 Przydatne linki

- [Troubleshooting DEVELOPER_ERROR](https://react-native-google-signin.github.io/docs/troubleshooting)
- [StackOverflow: DEVELOPER_ERROR solutions](https://stackoverflow.com/questions/56093020/developer-error-error-code-10-firebase-google-login-in-react-native)
- [Firebase Console](https://console.firebase.google.com/)
- [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials)

---

## ✨ Status: ROZWIĄZANE

**Data rozwiązania:** 4 lutego 2026

**Ostateczna przyczyna:** EAS wygenerował nowe SHA-1 które nie było dodane do Firebase Console i Google Cloud Console.

**Co naprawiło problem:** 
1. Dodanie aktualnego SHA-1 z `eas credentials` do Firebase
2. Pobranie nowego `google-services.json`
3. Nowy build z `--clear-cache`

---

_Plik stworzony jako dokumentacja procesu debugowania Google Sign-In w MendWise._
