## RepairMate – kontekst techniczny (MVP) i przebieg prac

Dokument podsumowuje to, co wdrożyliśmy podczas naszej sesji, dlaczego to zrobiliśmy, jak to działa oraz jakie są kolejne kroki do releasu na Google Play i App Store. Traktuj go jako „pamięć projektu” – stały kontekst do dalszych rozmów.

---

### 1) Cel MVP (skrót)
- **Produkt**: Aplikacja (Expo/React Native) do diagnozy usterek i kroków naprawy z pomocą AI (Gemini).
- **Użytkownik**: Logowanie Email/Hasło i Google (web; natywne później), akceptacja zgód, licznik darmowych wywołań, Paywall.
- **Backend**: Firebase Functions (ukryty klucz, weryfikacja ID tokenu, limity, logi), Firestore, Hosting (legal).

---

### 2) Backend (Cloud Functions – Node 22, Gen 2)
Plik: `functions/index.js`

#### Co zrobiliśmy i dlaczego
- **Jedna funkcja HTTP**: `generateDiagnosis` (region `us-central1`, `invoker: public`). Upraszcza integrację – front wysyła `systemInstruction` i `interactionId`.
- **Sekret klucza AI**: `GEMINI_API_KEY` w Secret Manager (bez klucza w froncie).
- **Weryfikacja autentykacji**:
  - Wymuszamy nagłówek `Authorization: Bearer <Firebase ID token>`.
  - Walidacja tokenu przez `admin.auth().verifyIdToken(...)`; brak/nieprawidłowy → 401.
- **Licznik darmowych wywołań (FREE=5)**:
  - Transakcja Firestore na `users/{uid}`; liczymy każde żądanie (validation/diagnosis/steps/chat itp.).
  - Limit na 6‑tej interakcji → 402 (Paywall).
- **Idempotencja licznika**:
  - Front wysyła **`interactionId`**.
  - Backend utrzymuje `recentInteractionIds` (ostatnie 20) i nie dolicza duplikatów.
- **Logi diagnostyczne (Cloud Logging)** bez treści promptów:
  - `ENTRY` (uid, interactionId, actionType), `TX_READ` (plan, callsTotal, alreadySeen),
    `TX_WRITE` (before/after), `LIMIT` (402), `OK` (200) oraz selektywnie błędy AI.
- **Obsługa błędów AI**: zwracamy spójne kody/statusy (np. 400/429), by UI reagował poprawnie.

#### Efekt
- Funkcja jest bezpieczna (token + Secret), przewidywalna (FREE=5 + idempotencja) i prosta w użyciu (jeden endpoint).
- Paywall pojawia się deterministycznie przy 6‑tej interakcji.

Funkcja URL: `https://generatediagnosis-knjglhjsmq-uc.a.run.app`

---

### 3) Firestore
- **Reguły** (`firestore.rules`): odczyt/zapis `users/{uid}` tylko przez właściciela (warunek `request.auth.uid == uid`).
- **Dokument `users/{uid}`**:
  - `plan: 'free'|'pro'`
  - `callsTotal: number`
  - `consented: boolean`
  - `createdAt`, `updatedAt`
  - `recentInteractionIds: string[]` (idempotencja)

---

### 4) Hosting (Legal)
- Katalog `web/`: `index.html`, `privacy.html`, `terms.html`.
- `firebase.json`:
  - `public: web`.
  - Redirecty 301: `/privacy` → `/privacy.html`, `/terms` → `/terms.html`.
  - Nagłówki `Cache-Control: public, max-age=0, must-revalidate` (pewne odświeżanie wersji).

---

### 5) Frontend – warstwa platformy
- `firebaseConfig.ts`: eksport `app`; `getAnalytics` tylko na web.
- `services/firebase.ts` (leniwe singletony):
  - `auth`, `db` (stabilność Expo RN dzięki `experimentalAutoDetectLongPolling: true`, `useFetchStreams: false`).
- `constants/api.ts`: `FUNCTION_URL` do funkcji backendowej.
- `services/api.ts` (wrapper HTTP):
  - Zawsze pobiera ID token: `await auth.currentUser.getIdToken()`.
  - Dodaje nagłówek `Authorization: Bearer <token>`.
  - 402 → `router.push('/paywall')` + błąd `{ code: 'LIMIT' }`.
  - 401 → `router.push('/signin')`.

---

### 6) Frontend – logika AI (wszystko przez backend)
Plik: `services/geminiService.ts`
- Metody: `validateIsRepairQuery`, `diagnoseIssue`, `getRepairSteps`, `getChatResponse`.
- Każda wywołuje `callGeminiBackend(...)` i dodaje unikalny **`interactionId`**.
- UI nie dubluje alertów dla 401/402 – nawigację prowadzi wrapper.

---

### 7) Frontend – ekrany i routing
- `app/welcome.tsx`: prosty ekran startowy → `/signin`.
- `app/(auth)/signin.tsx`: Email/Hasło (+ Google web). Po sukcesie upsert `users/{uid}` i decyzja: zgody → `/consents`, w przeciwnym wypadku `/`.
- `app/(auth)/signup.tsx`: osobny ekran rejestracji (Email/Hasło + confirm).
- `app/consents.tsx`: dwie zgody + linki do hostowanych stron; zapis `consented: true` → `/`.
- `app/diagnosis.tsx`: guard anty‑dublety (ref), brak wstecz przy 402.
- `app/steps.tsx`: guard anty‑dublety, `router.replace('/')` na „All Done”, brak wstecz przy 402.
- `app/paywall.tsx`: placeholder (benefity, przyciski Go Pro/Restore – pod IAP).
- `app/_layout.tsx`: globalne guardy (auth i consents) + `UserMenu` w headerze (e‑mail, ustawienia, wyloguj).

---

### 8) Testy – jak weryfikować
- Scenariusz startowy (FREE=5, liczymy wszystko):
  1) validate (1)
  2) diagnosis (2)
  3) steps (3)
  4) validate (drugi prompt) (4)
  5) diagnosis (drugi prompt) (5)
  6) steps (drugi prompt) (6) → 402 (Paywall)
- Logi (Cloud Logging): szukaj `ENTRY`, `TX_READ`, `TX_WRITE`, `LIMIT`, `OK` i `alreadySeen` (duplikaty).

---

### 9) Najczęstsze źródła błędów i nasze zabezpieczenia
- **StrictMode/dev odświeżenia** → podwójne wywołania: guardy `useRef` + idempotencja `interactionId`.
- **Stare sesje (ten sam e‑mail)** → możliwe zamieszanie tokenami: rekomendowana persystencja Auth (AsyncStorage) – do wdrożenia.
- **Alert zamiast Paywalla** → poprawiona obsługa błędów i nawigacji (nie cofamy ekranu przy 402/401).

---

### 10) Następne kroki do releasu
1) **Stabilność i telemetria**
   - Persystencja Auth w RN: `@react-native-async-storage/async-storage` + `initializeAuth(...getReactNativePersistence(...))`.
   - Minimalny Crashlytics/Analytics.
2) **Onboarding** (po Consents)
   - 3–4 karty „jak korzystać”; `users/{uid}.onboarded=true`.
3) **IAP & Paywall (RevenueCat)**
   - Produkty, entitlements; synchronizacja `plan='pro'` w `users/{uid}`.
4) **Google Sign‑In natywny (expo-auth-session)**
   - Wymaga OAuth Client ID Android + SHA‑1 (Firebase Console).
5) **UX/Polish**
   - Toastery, haptics, stany błędów, A11y, loading states.
6) **Security i koszty**
   - Zawęzić CORS, rozważyć App Check, monitorować koszty/latencję.
7) **Build & Release**
   - EAS Build (Android/iOS), TestFlight/Play Internal, listing (ikony, zrzuty, opisy, polityka prywatności).

---

### 11) Co jest teraz zrobione (checklista)
- [x] Backend: verifyIdToken, limiter FREE=5, idempotencja, logi.
- [x] Firestore: reguły `users/{uid}` (właściciel only).
- [x] Hosting: Terms/Privacy (redirecty 301 + kontrola cache).
- [x] Front: wrapper z tokenem i obsługą 402/401.
- [x] Front: ekrany Welcome/Signin/Signup/Consents/Diagnosis/Steps/Paywall, guard w layout, menu użytkownika.
- [x] Guardy anty‑dublety w `Diagnosis` i `Steps`.

---

### 12) Notatki wdrożeniowe
- Funkcja prod: `https://generatediagnosis-knjglhjsmq-uc.a.run.app`
- Reguły Firestore: `firestore.rules` (deploy: `firebase deploy --only firestore:rules`).
- Secret: `GEMINI_API_KEY` (zarządzany w Secret Manager; nie commitujemy).
- Jak czytać limit: patrz sekwencje `TX_READ/TX_WRITE/LIMIT` i `callsTotal` w logach.

---

### 13) Decyzje i otwarte punkty
- IAP: rekomendacja RevenueCat (upraszcza integrację dla obu sklepów).
- Google Sign‑In (natywne): po IAP/onboardingu.
- Opcjonalny wskaźnik „Used X / 5” w UI (tylko odczyt z `users/{uid}`) – do rozważenia.

---

W razie pytań – logi backendu są kanoniczne do śledzenia naliczania, a cała komunikacja z AI przechodzi przez wrapper z tokenem i idempotencją. Dzięki temu mamy deterministyczne zachowanie w dev i prod.
