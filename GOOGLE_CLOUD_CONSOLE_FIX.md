# 🔧 GOOGLE SIGN-IN - KONFIGURACJA GOOGLE CLOUD CONSOLE

## ❌ **GŁÓWNY PROBLEM:**

```
Error 400: invalid_request
Custom URL scheme is not enabled for your Android client
```

**Przyczyna:** `expo-auth-session` w React Native NIE DZIAŁA z Android OAuth Client!

---

## ✅ **ROZWIĄZANIE - 2 OPCJE:**

### **OPCJA 1: Użyj Web OAuth Client (ZALECANE)**

`expo-auth-session` dla Android faktycznie używa **Web OAuth flow** przez przeglądarkę!

#### **Krok 1: Sprawdź Web Client ID w Google Cloud Console**

1. Idź do: https://console.cloud.google.com/apis/credentials?project=repairmate-mvp
2. Znajdź **Web client** (ID: `432126526994-qf7v8bthqohpvik7s51utjd7io8jin3m`)
3. Kliknij **Edit**

#### **Krok 2: Dodaj Authorized redirect URIs**

W sekcji **"Authorized redirect URIs"** dodaj:

```
https://auth.expo.io/@lukinopawlalino/mendwise
```

**Format:**
```
https://auth.expo.io/@[EXPO_USERNAME]/[APP_SLUG]
```

Gdzie:
- `EXPO_USERNAME` = twoje username w Expo (z `app.json:59` → `owner: "lukinopawlalino"`)
- `APP_SLUG` = slug aplikacji (z `app.json:4` → `slug: "mendwise"`)

#### **Krok 3: Sprawdź Authorized JavaScript origins**

Dodaj:
```
https://auth.expo.io
```

#### **Krok 4: Zapisz zmiany**

Kliknij **"Save"** w Google Cloud Console.

**POCZEKAJ 5-10 MINUT** aż zmiany się propagują!

---

### **OPCJA 2: Użyj @react-native-google-signin/google-signin (ALTERNATYWA)**

Jeśli `expo-auth-session` dalej nie działa, możesz użyć dedykowanej biblioteki dla Google Sign-In.

#### **Instalacja:**

```bash
npx expo install @react-native-google-signin/google-signin
```

#### **Konfiguracja:**

```typescript
// W AuthForm.tsx zastąp expo-auth-session
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Inicjalizacja
GoogleSignin.configure({
  webClientId: '432126526994-qf7v8bthqohpvik7s51utjd7io8jin3m.apps.googleusercontent.com', // Web Client ID
  offlineAccess: true,
});

// Logowanie
const handleGoogleSignIn = async () => {
  try {
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    const credential = GoogleAuthProvider.credential(userInfo.idToken);
    await signInWithCredential(auth, credential);
  } catch (error) {
    console.error('Google Sign-In Error:', error);
  }
};
```

Ta biblioteka używa **native Google Sign-In SDK** i nie wymaga redirect URIs!

---

## 🎯 **CO ZROBIĆ TERAZ (WYBIERZ OPCJĘ):**

### **Dla OPCJI 1 (expo-auth-session - NAJPROSTSZE):**

1. **Dodaj redirect URI do Web Client w Google Cloud Console:**
   ```
   https://auth.expo.io/@lukinopawlalino/mendwise
   ```

2. **Poczekaj 5-10 minut**

3. **Zbuduj nowy APK z --clear-cache:**
   ```bash
   eas build --profile preview --platform android --clear-cache
   ```

4. **Testuj!**

---

### **Dla OPCJI 2 (@react-native-google-signin - BARDZIEJ NIEZAWODNE):**

1. **Zainstaluj bibliotekę:**
   ```bash
   npx expo install @react-native-google-signin/google-signin
   ```

2. **Zaktualizuj AuthForm.tsx** (mogę to zrobić za Ciebie)

3. **Zbuduj:**
   ```bash
   eas build --profile preview --platform android --clear-cache
   ```

---

## 📊 **DLACZEGO TO SIĘ DZIEJE:**

### **expo-auth-session w React Native:**

`expo-auth-session` na Android:
1. Otwiera przeglądarkę (Chrome)
2. Użytkownik loguje się do Google
3. Google przekierowuje do `https://auth.expo.io/@username/appslug`
4. Expo Auth Proxy przekierowuje z powrotem do aplikacji przez custom URL scheme `repairmate://`

**Dlatego redirect URI MUSI być w Web Client, nie Android Client!**

### **@react-native-google-signin/google-signin:**

Ta biblioteka:
1. Używa native Android Google Sign-In SDK
2. NIE wymaga przeglądarki
3. NIE wymaga redirect URIs
4. Jest bardziej niezawodna dla native apps

---

## 🔍 **JAK SPRAWDZIĆ CZY JEST POPRAWNIE SKONFIGUROWANE:**

### **Google Cloud Console:**

1. Idź do: https://console.cloud.google.com/apis/credentials?project=repairmate-mvp
2. Web client → Edit
3. **Authorized redirect URIs** powinny zawierać:
   ```
   https://auth.expo.io/@lukinopawlalino/mendwise
   ```
4. **Authorized JavaScript origins** powinny zawierać:
   ```
   https://auth.expo.io
   ```

### **Firebase Console:**

1. Idź do: https://console.firebase.google.com/project/repairmate-mvp/authentication/settings
2. **Authorized domains** powinny zawierać:
   - `localhost`
   - `repairmate-mvp.firebaseapp.com`
   - `auth.expo.io` ← DODAJ TO!

---

## 🚀 **POLECANA ŚCIEŻKA:**

### **Krok 1: Spróbuj OPCJI 1 (expo-auth-session)**

To jest najprostsze - tylko dodaj redirect URI w Google Cloud Console.

### **Krok 2: Jeśli nie działa → OPCJA 2**

Użyj `@react-native-google-signin/google-signin` - bardziej niezawodne dla native apps.

---

## 💡 **BONUS - expo-auth-session vs native Google Sign-In:**

| Funkcja | expo-auth-session | @react-native-google-signin |
|---------|-------------------|------------------------------|
| **Sposób działania** | Przez przeglądarkę | Native SDK |
| **Redirect URIs** | ✅ Wymagane | ❌ Nie wymagane |
| **Setup** | Prostszy | Trochę bardziej złożony |
| **Niezawodność** | Średnia | Wysoka |
| **UX** | Otwiera przeglądarkę | Bezpośrednio w app |

Dla production app, `@react-native-google-signin` jest lepszym wyborem!

---

## 📞 **JEŚLI POTRZEBUJESZ POMOCY:**

1. Spróbuj OPCJI 1 (dodaj redirect URI)
2. Poczekaj 5-10 minut
3. Zbuduj z `--clear-cache`
4. Testuj

Jeśli dalej nie działa - daj znać, przejdziemy na OPCJĘ 2! 🚀
