🎯 Cel na dziś — co ma być na koniec

Backend: Cloud Function generateDiagnosis wymaga ID tokenu Firebase, weryfikuje go, liczy AI‑calle w Firestore (limit FREE=3), przy przekroczeniu zwraca HTTP 402. Reguły Firestore ograniczają dostęp do users/{uid}.

Auth: włączone i działające Email & Password + Google Sign‑In (Android na dev — przez expo-auth-session + Firebase).

Ekrany w aplikacji (Expo Router) i kolejność:

/welcome → CTA „Get started”

/signin → logowanie (Email/Hasło + Google)

/consents → 2 checkboxy (Terms / Privacy) + linki do https://repairmate-mvp.web.app/terms
 i /privacy

Main flow (to co już masz)

/paywall → pojawia się gdy backend zwróci 402

Zachowanie:

przy starcie: brak sesji → /signin; po zalogowaniu i braku zgód → /consents; po zgodach → main.

każdorazowe wywołanie backendu: wysyłamy Authorization: Bearer <idToken>.

4‑te wywołanie na FREE → nawigacja do /paywall. Czyli 3 są za free a 4-te już jest po przejściu paywalla.

✅ Prerekwizyty (szybka checklista)

Firebase Console → Authentication:

Email/Password = ON

Google = ON (zostaw domyślne Web Client ID)

Google Console (dla Google Sign‑In na Android):

utwórz OAuth Client ID Android (możesz użyć debug SHA‑1 z Firebase > Project settings > Your apps > Android → Add fingerprint)

W projekcie Expo: firebase i expo-auth-session zainstalowane.

🧱 Krok po kroku – co robimy dzisiaj
1) Backend (Functions) — weryfikacja tokenu + limiter

W functions doinstaluj Admin SDK i firestore helpers (jeśli brak):

cd functions && npm i firebase-admin && cd ..


W functions/index.(js|ts):

zainicjuj firebase-admin

zweryfikuj ID token z nagłówka Authorization

transakcja: users/{uid} → jeśli plan==='free' && callsTotal>=3 → rzuć błąd → zwróć 402

dopiero wtedy wołaj Gemini i zwróć wynik

Reguły Firestore (root projektu → firestore.rules):

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}


Deploy reguł:

firebase deploy --only firestore:rules

2) Ekrany (Expo Router)

Utwórz:

app/welcome.tsx — proste CTA → /signin

app/(auth)/signin.tsx — dwa warianty:

Email/Hasło: createUserWithEmailAndPassword, signInWithEmailAndPassword

Google: expo-auth-session → pobierz token Google → GoogleAuthProvider.credential(idToken) → signInWithCredential

app/consents.tsx — 2 checkboxy + linki do hostingu; zapis users/{uid}.consented=true (Firestore)

app/paywall.tsx — tytuł, benefity, przyciski „Go Pro (TODO)” i „Restore (TODO)”

Guard w _layout.tsx (lub w osobnym hooku): nasłuch onAuthStateChanged; brak usera → /signin; brak zgód → /consents.

3) Wrapper do backendu

Stwórz services/api.ts:

przed każdym wywołaniem pobierz: const idToken = await auth.currentUser?.getIdToken(true)

dodaj nagłówek Authorization: Bearer ${idToken}

jeśli response.status===402 → router.push('/paywall')

4) Testy funkcjonalne (muszą przejść dziś)

Fresh install → /welcome → /signin (Email/Hasło) → /consents → main.

3 wywołania AI OK, 4‑te → /paywall.

Linki Terms/Privacy otwierają hosting.

Google Sign‑In na Android dev działa (jeśli brak Android OAuth ID, zostaw TODO i potwierdź Email/Hasło).

🧑‍💻 Jedno polecenie dla Cursor (brief implementacyjny)
```md 

Skopiuj wszystko poniżej i wklej do Cursor:

You are the senior engineer for our Expo (React Native) app using Firebase. Implement today’s onboarding/auth/legal/paywall flow and wire it to our existing Cloud Function.

GOAL (end of day)
- Firebase Auth with Email/Password + Google (Android dev via expo-auth-session).
- Cloud Function `generateDiagnosis` requires Firebase ID token, verifies it (Admin SDK), enforces FREE limit=3 calls/user in Firestore (transaction), returns HTTP 402 when exceeded.
- App screens and order: /welcome → /signin → /consents → main; /paywall shown only when backend returns 402.
- Firestore rules restrict `users/{uid}` to the signed-in user.

BACKEND TASKS
1) In `functions/index.(js|ts)`:
   - Initialize `firebase-admin`.
   - Verify ID token from `Authorization: Bearer <idToken>`. If missing/invalid → 401.
   - Transaction on `users/{uid}`:
     - Create doc if missing: `{ plan:'free', callsTotal:0, consented:false, createdAt, updatedAt }`.
     - If `plan==='free' && callsTotal>=3` → return HTTP 402 `{ error:'LIMIT_EXCEEDED' }`.
     - Else increment `callsTotal` and proceed to call Gemini (existing logic), return the AI result.
   - Keep CORS as is.
2) Firestore security rules (`firestore.rules`):
   - Only the authenticated user can read/write `users/{uid}`:
     ```
     rules_version = '2';
     service cloud.firestore {
       match /databases/{database}/documents {
         match /users/{uid} {
           allow read, write: if request.auth != null && request.auth.uid == uid;
         }
       }
     }
     ```
   - Deploy rules.

FRONTEND TASKS (Expo Router, TypeScript)
Create screens:
- `app/welcome.tsx`: simple hero + “Get started” → navigate to `/signin`.
- `app/(auth)/signin.tsx`:
  - Email/Password: fields + buttons: “Sign up” and “Sign in” using Firebase Auth (`createUserWithEmailAndPassword`, `signInWithEmailAndPassword`).
  - Google Sign-In (Android dev): use `expo-auth-session` Google flow, then:
    `const credential = GoogleAuthProvider.credential(idToken); await signInWithCredential(auth, credential);`
  - After sign-in: upsert `users/{uid}` with `{ plan: existing||'free', callsTotal: existing||0, consented: existing||false, createdAt/updatedAt }`.
  - If `consented !== true` → navigate `/consents`; else go to main (existing root).
- `app/consents.tsx`:
  - Two checkboxes with links to:
    - Terms: https://repairmate-mvp.web.app/terms
    - Privacy: https://repairmate-mvp.web.app/privacy
  - “Continue” is disabled until both are checked.
  - On continue: Firestore `users/{uid}` → `{ consented:true }` (merge), then navigate to main.
- `app/paywall.tsx`:
  - Title “Get RepairMate Pro”, 3–4 benefit bullets, buttons: “Go Pro (TODO)”, “Restore (TODO)”.
  - Export a helper to navigate here (`router.push('/paywall')`).

Auth guard:
- In the root layout (or a dedicated provider), set an `onAuthStateChanged` listener.
- If no user → route `/signin`. If user exists but `consented!==true` (fetched once) → `/consents`.

API wrapper:
- Create `services/api.ts` with `callDiagnosis(payload)`:
  - Acquire token: `await auth.currentUser?.getIdToken(true)`. If absent → navigate `/signin`.
  - `fetch(FUNCTION_URL, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:'Bearer '+idToken }, body: JSON.stringify(payload) })`
  - If status === 402 → `router.push('/paywall')` and throw a handled error.
  - Return parsed result on 200.

Firestore rules:
- Place rules from BACKEND TASKS and deploy.

ACCEPTANCE CRITERIA
- Fresh install → `/welcome` → `/signin` (Email/Password) → `/consents` → main.
- After consenting once, reopening the app skips `/consents`.
- Calls to function include `Authorization` header; without it → 401.
- First 3 calls succeed; the 4th returns 402 and the app navigates to `/paywall`.
- Links on `/consents` open our Firebase Hosting URLs for Terms/Privacy.
- Provide a list of created/modified files and code snippets for critical parts (auth handlers, API wrapper).
``` 

🧪 Szybki plan testów po wdrożeniu

Zarejestruj usera (Email/Hasło) → sprawdź /users/{uid} w Firestore.

Zaznacz zgody → consented=true zapisane.

Wykonaj 4 wywołania AI → 4‑te przenosi do /paywall.

Zrób sign‑out / sign‑in — flow wraca poprawnie.

(Opcjonalnie) Google Sign‑In na Android dev — jeśli OAuth ID gotowe.