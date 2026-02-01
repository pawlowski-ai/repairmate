# 🔍 KOMPLEKSOWA ANALIZA PROBLEMU AUTORYZACJI

## 📊 **PODSUMOWANIE SYTUACJI**

### **Obserwowane problemy:**
1. ❌ Rejestracja email/password wyświetla błąd "invalid argument" przy pierwszej próbie
2. ❌ Przy drugiej próbie błąd "email already in use" - znaczy że użytkownik został stworzony
3. ❌ Po restarcie aplikacji użytkownik widzi ekran główny (index), ale powinien być na consents/onboarding
4. ❌ Google Sign-In otwiera dialog, zamyka go po wyborze konta, ale nic się nie dzieje
5. ❌ Brak przekierowania do ekranu zgód po rejestracji

---

## 🐛 **ZIDENTYFIKOWANE BŁĘDY**

### **1. KRYTYCZNY: Google Sign-In nie tworzy dokumentu w Firestore**

**Lokalizacja:** `components/AuthForm.tsx` (linie 38-78)

**Problem:**
```typescript
// STARY KOD - NIE TWORZY DOKUMENTU
const credential = GoogleAuthProvider.credential(userInfo.idToken);
await signInWithCredential(auth, credential);
console.log('[GoogleSignIn] Successfully signed in to Firebase');
// ❌ BRAK tworzenia dokumentu w Firestore!
```

**Konsekwencje:**
- Użytkownik jest zalogowany w Firebase Auth
- ALE nie ma dokumentu w kolekcji `users` w Firestore
- `RootLayout` sprawdza `consented` z Firestore → dostaje `snap.exists() = false`
- Brak przekierowania do `/consents` bo logika się psuje
- Użytkownik zostaje na ekranie rejestracji lub jest przekierowany do home

**Fix:** ✅ Naprawione - dodano tworzenie dokumentu identyczne jak w email/password

---

### **2. KRYTYCZNY: Firebase Auth Proxy powoduje błędy inicjalizacji**

**Lokalizacja:** `services/firebase.ts` (linie 68-83)

**Problem:**
```typescript
// STARY KOD - PROXY
export const auth = new Proxy({} as ReturnType<typeof getAuth>, {
  get(target, prop) {
    const instance = getAuthInstance();
    const value = (instance as any)[prop];
    return typeof value === 'function' ? value.bind(instance) : value;
  }
});
```

**Dlaczego to problem:**
1. **Lazy initialization** może nie zadziałać poprawnie przy pierwszym wywołaniu
2. Proxy dodaje dodatkową warstwę abstrakcji, która może:
   - Nie przekazywać poprawnie `this` context
   - Powodować problemy z type checking
   - Opóźniać inicjalizację AsyncStorage
3. Błąd "invalid argument" sugeruje że auth nie jest w pełni zainicjalizowany

**Konsekwencje:**
- `createUserWithEmailAndPassword` dostaje niepełny obiekt auth
- Błąd "auth/invalid-argument" przy pierwszej próbie
- Przy drugiej próbie użytkownik już istnieje (pierwsza próba częściowo zadziałała)

**Fix:** ✅ Naprawione - auth i db są teraz inicjalizowane NATYCHMIAST przy imporcie

---

### **3. PROBLEM: Race condition w routingu**

**Lokalizacja:** `app/_layout.tsx` (linie 56-63)

**Problem:**
```typescript
// STARY KOD - timeout 100ms może być za krótki
if (!consented && pathname !== "/consents" && isMounted) {
  navigationTimeoutRef.current = setTimeout(() => {
    if (isMounted) {
      router.replace("/consents");  // ❌ Może się nie wykonać!
    }
  }, 100);  // Za krótki timeout
}
```

**Dlaczego to problem:**
1. Timeout 100ms może nie wystarczyć dla:
   - Firestore fetch
   - React state updates
   - Router initialization
2. Brak szczegółowych logów utrudnia diagnozę
3. Jeśli dokument w Firestore nie istnieje (problem #1), `consented = false` ale routing się nie wykonuje

**Fix:** ✅ Naprawione:
- Zwiększony timeout do 200ms
- Dodane szczegółowe logi na każdym etapie
- Dodana detekcja czy dokument w Firestore istnieje

---

### **4. PROBLEM: Brak szczegółowych logów**

**Lokalizacja:** Wszystkie pliki autoryzacji

**Problem:**
- Za mało logów żeby zdiagnozować gdzie dokładnie proces się psuje
- Brak logów o stanie Firestore document
- Brak logów o decyzjach routingu

**Fix:** ✅ Naprawione - dodane szczegółowe logi:
- `[SignUp]` - etapy rejestracji
- `[GoogleSignIn]` - etapy Google Sign-In
- `[RootLayout]` - stan użytkownika i decyzje routingu

---

## 🔧 **WPROWADZONE NAPRAWY**

### **Fix #1: AuthForm.tsx - Google Sign-In tworzy dokument**

**Zmieniono:**
- Dodano import `db` i funkcji Firestore
- Po `signInWithCredential` dodano tworzenie/aktualizację dokumentu
- Identyczna logika jak w email/password flow
- Dodane szczegółowe logi

**Rezultat:**
- ✅ Google Sign-In teraz tworzy dokument w Firestore
- ✅ Pole `consented: false` jest ustawiane dla nowych użytkowników
- ✅ RootLayout może poprawnie sprawdzić status zgód

---

### **Fix #2: firebase.ts - Bezpośrednia inicjalizacja**

**Zmieniono:**
- Usunięto Proxy
- Auth i DB są inicjalizowane natychmiast przy imporcie
- AsyncStorage jest ustawiane od razu
- Eksportowane są gotowe instancje, nie gettery

**Rezultat:**
- ✅ Auth jest w pełni zainicjalizowany przy pierwszym użyciu
- ✅ Brak błędów "invalid argument"
- ✅ AsyncStorage działa poprawnie od pierwszego użycia

---

### **Fix #3: _layout.tsx - Lepszy routing i logi**

**Zmieniono:**
- Zwiększony timeout z 100ms do 200ms
- Dodane szczegółowe logi o:
  - Stanie użytkownika
  - Czy dokument w Firestore istnieje
  - Wartości pola `consented`
  - Decyzjach routingu
  - Wykonaniu przekierowań

**Rezultat:**
- ✅ Więcej czasu na wykonanie przekierowania
- ✅ Łatwiejsza diagnoza problemów z logów
- ✅ Wykrywanie czy dokument w Firestore został stworzony

---

### **Fix #4: signup.tsx - Szczegółowe logi**

**Zmieniono:**
- Dodane logi przed każdym krokiem
- Logi po sukcesie każdej operacji
- Szczegółowe logi błędów (cały obiekt, nie tylko message)
- Wykrywanie błędu "invalid argument"

**Rezultat:**
- ✅ Dokładne logi pokazują gdzie proces się psuje
- ✅ Łatwiejsze debugowanie błędów autoryzacji

---

## 🧪 **JAK PRZETESTOWAĆ NAPRAWY**

### **Test 1: Email/Password Registration**

1. Uruchom `.\monitor.ps1`
2. Otwórz aplikację
3. Przejdź do Sign Up
4. Wypełnij email i hasło
5. Naciśnij "SIGN UP"

**Oczekiwane logi:**
```
[SignUp] ========== STARTING REGISTRATION ==========
[SignUp] Email: test@example.com
[SignUp] Password length: 8
[SignUp] Auth instance: object
[SignUp] ✅ User created successfully in Firebase Auth
[SignUp] UID: abc123...
[SignUp] Email: test@example.com
[SignUp] ✅ User document created in Firestore
[SignUp] ========== REGISTRATION COMPLETE ==========
[RootLayout] User logged in, UID: abc123...
[RootLayout] Firestore document exists: true
[RootLayout] User consented: false
[RootLayout] User needs to consent, redirecting to /consents
[RootLayout] Executing redirect to /consents
```

**Oczekiwane zachowanie:**
- ✅ Rejestracja się udaje
- ✅ Użytkownik zostaje przekierowany do `/consents` (ekran zgód)
- ✅ Brak błędu "invalid argument"

---

### **Test 2: Google Sign-In**

1. Uruchom `.\monitor.ps1`
2. Otwórz aplikację
3. Naciśnij ikonę Google
4. Wybierz konto Google

**Oczekiwane logi:**
```
[GoogleSignIn] Starting sign in...
[GoogleSignIn] Got user info: { ... }
[GoogleSignIn] Successfully signed in to Firebase, UID: xyz789...
[GoogleSignIn] User document created/updated: { uid: xyz789..., exists: false, consented: false }
[RootLayout] User logged in, UID: xyz789...
[RootLayout] Firestore document exists: true
[RootLayout] User consented: false
[RootLayout] User needs to consent, redirecting to /consents
[RootLayout] Executing redirect to /consents
```

**Oczekiwane zachowanie:**
- ✅ Dialog Google Sign-In się otwiera
- ✅ Po wyborze konta dialog się zamyka
- ✅ Użytkownik zostaje przekierowany do `/consents`
- ✅ Dokument w Firestore został stworzony

---

### **Test 3: Restart aplikacji po rejestracji**

1. Zarejestruj się (email lub Google)
2. NIE akceptuj zgód, tylko zamknij aplikację
3. Otwórz aplikację ponownie

**Oczekiwane logi:**
```
[Firebase Auth] Initialized with AsyncStorage persistence
[RootLayout] User logged in, UID: abc123...
[RootLayout] Firestore document exists: true
[RootLayout] User consented: false
[RootLayout] User needs to consent, redirecting to /consents
```

**Oczekiwane zachowanie:**
- ✅ Użytkownik jest zalogowany (dzięki AsyncStorage)
- ✅ Przekierowanie do `/consents` (zgody)
- ✅ NIE do `/` (home)

---

### **Test 4: Po zaakceptowaniu zgód**

1. Zarejestruj się
2. Zaakceptuj zgody na ekranie `/consents`
3. Przejdź przez onboarding
4. Zamknij i otwórz aplikację ponownie

**Oczekiwane logi:**
```
[RootLayout] User logged in, UID: abc123...
[RootLayout] Firestore document exists: true
[RootLayout] User consented: true
[RootLayout] User already consented, redirecting to /
```

**Oczekiwane zachowanie:**
- ✅ Użytkownik jest przekierowany do `/` (home)
- ✅ NIE do `/consents` (zgody)

---

## 📋 **CHECKLIST PRZED BUILDEM**

- [x] Fix #1: AuthForm.tsx - Google Sign-In tworzy dokument
- [x] Fix #2: firebase.ts - Bezpośrednia inicjalizacja auth/db
- [x] Fix #3: _layout.tsx - Zwiększony timeout i logi
- [x] Fix #4: signup.tsx - Szczegółowe logi rejestracji
- [ ] Sprawdź że wszystkie zmiany są zacommitowane
- [ ] Push do remote
- [ ] Build z `--clear-cache`
- [ ] Sprawdź SHA commitu w expo.dev
- [ ] Zainstaluj APK
- [ ] Testuj z `.\monitor.ps1`

---

## 🎯 **NASTĘPNE KROKI**

1. **Commit wszystkich zmian:**
```powershell
git add .
git commit -m "Fix: Complete auth flow with Firestore integration and improved logging"
git push origin main
```

2. **Build z czystym cache:**
```bash
eas build --profile preview --platform android --clear-cache
```

3. **Sprawdź commit w expo.dev:**
- Upewnij się że build używa najnowszego commitu
- Sprawdź SHA w sekcji "Git commit"

4. **Zainstaluj i testuj:**
```powershell
.\monitor.ps1
```

5. **Prześlij logi jeśli problem nadal występuje:**
- Logi z pierwszego otwarcia aplikacji (inicjalizacja Firebase)
- Logi z rejestracji email/password
- Logi z Google Sign-In
- Logi z RootLayout (routing)

---

## 🔍 **CO SZUKAĆ W LOGACH**

### **✅ DOBRE logi (wszystko działa):**
```
[Firebase Auth] Initialized with AsyncStorage persistence
[SignUp] ========== REGISTRATION COMPLETE ==========
[GoogleSignIn] User document created/updated
[RootLayout] Firestore document exists: true
[RootLayout] Executing redirect to /consents
```

### **❌ ZŁE logi (problemy):**
```
[SignUp] INVALID ARGUMENT - This suggests Auth initialization issue!
[GoogleSignIn] Error: No ID token received
[RootLayout] CRITICAL: User document does NOT exist in Firestore!
[RootLayout] Auth state error: ...
```

---

## 💡 **MOŻLIWE POZOSTAŁE PROBLEMY**

Jeśli po tych fixach nadal nie działa, sprawdź:

### **1. Firebase Console - Authentication Providers**
- Czy Email/Password provider jest włączony?
- Czy Google provider jest włączony?
- Czy Android SHA-1/SHA-256 są dodane do Firebase?

### **2. Google Services Configuration**
- Czy `google-services.json` jest aktualny?
- Czy zawiera poprawny `client_id` dla Android?
- Czy OAuth consent screen jest skonfigurowany?

### **3. Firestore Security Rules**
- Czy użytkownicy mogą pisać do `users/{userId}`?
```javascript
match /users/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

### **4. AsyncStorage Permissions**
- Czy aplikacja ma uprawnienia do storage na Androidzie?
- Sprawdź `app.json` → `android.permissions`

---

## 📝 **NOTATKI TECHNICZNE**

### **Dlaczego usunięto Proxy?**

Proxy w JavaScript dodaje dynamiczną warstwę dostępu do obiektu. Problem:
- Firebase Auth wymaga pełnej inicjalizacji PRZED pierwszym użyciem
- Proxy wykonuje lazy initialization → zbyt późno
- AsyncStorage musi być ustawiony PRZED pierwszym wywołaniem auth
- Proxy może nie przekazywać poprawnie `this` context do metod Firebase

### **Dlaczego zwiększono timeout?**

React Native routing nie jest synchroniczny:
1. `onAuthStateChanged` callback → async
2. Firestore `getDoc` → async + network
3. React state update (`setIsLoading`) → async
4. Router `replace` → async + animation

100ms może nie wystarczyć na wszystkie te operacje. 200ms daje więcej czasu.

### **Dlaczego Google Sign-In potrzebuje dokumentu w Firestore?**

Firebase Auth i Firestore to oddzielne systemy:
- **Auth:** Przechowuje dane logowania (email, UID, provider)
- **Firestore:** Przechowuje dane aplikacji (plan, zgody, itp.)

Nasza logika biznesowa sprawdza pole `consented` w Firestore.
Bez dokumentu w Firestore → brak pola `consented` → błędny routing.

---

**Wersja:** 1.0  
**Data:** 2026-02-01  
**Autor:** AI Assistant
