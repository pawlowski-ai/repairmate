# Mendwise – Auth Screen Design Brief (Login / Sign‑up)

Źródło przepływu: patrz `user.flow.md` (krok 2 po Splash).

## 1) Cel ekranu
- **Rola:** ekran uwierzytelniania dla nowych, niezalogowanych użytkowników.
- **Cel UX:** szybkie wejście do produktu, jasne opcje logowania, zero rozpraszaczy.
- **Nastrój:** pewność i sprawczość (kontynuacja vibe ze Splash). Minimalizm, czytelność, brak „karnawału”.

## 2) Device baseline i siatka
- Referencja: iPhone 15 Pro – 393×852 pt (dp). Skalować responsywnie.
- Safe Area: obowiązkowo (top/bottom).
- Padding poziomy ekranu: 24.
- Skala odstępów (4‑pt): 8 / 16 / 24.
- StatusBar: `light` nad ciemnym tłem.

## 3) Kolory (HEX)
- **Background Black:** `#000000` (pełne tło ekranu – spójnie ze Splash)
- **White:** `#FFFFFF` (nagłówki/kontrast)
- **Muted Grey:** `#B9B9B9` (tekst pomocniczy, etykiety pól)
- **Ink Dark:** `#0B0B0B` (tekst na zielonym przycisku)
- **Primary Green:** `#27D969` (primary CTA „Continue / Sign in”)
- (Opcjonalnie) **Outline Grey:** `#2A2A2A` (obrys pól, divider)

Uwagi: zielony to kolor akcji (primary). Unikamy dodatkowych akcentów – prostota i skupienie na konwersji.

## 4) Typografia
- **H1 (hero tytuł):** Inter Black 28/34, all caps, letterSpacing 0.2, kolor `#FFFFFF`.
- **Body:** Inter Regular 14/20, kolor `#B9B9B9`.
- **Button:** Inter Semibold 18/22, kolor `#0B0B0B` (na zielonym CTA).

Fallbacki: iOS SF Pro Display Heavy / Android Roboto Black tam, gdzie brak Inter.

## 5) Layout sekcji (pionowo)
1. Branding (top)
   - Wordmark „mendwise” (tekstowy), kolor `#FFFFFF`. Margines od góry: 16–24.
   - Alternatywnie małe logo/ikona, jeśli dostępne.
2. Tytuł
   - H1: „WELCOME BACK” (login) lub „CREATE ACCOUNT” (sign‑up).
3. Formularz
   - Dwa pola: Email, Password.
   - Pola „filled dark”: background `rgba(255,255,255,0.06)` lub #111–#161, radius 12, padding pionowy 12, obrys `#2A2A2A`.
   - Tekst w polach: `#FFFFFF`, placeholder: `#B9B9B9`.
   - Odstęp między polami: 12–16.
4. Primary CTA
   - Wysokość 56, radius 28, pełna szerokość – padding L/R 24.
   - Label: „Sign in” (login) / „Create account” (sign‑up).
   - Tło: `#27D969`; label: `#0B0B0B`.
5. Secondary actions
   - Ghost/outline button: „Continue with Google” (na web: `signInWithPopup` już działa; natywny później).
   - Link tekstowy (14/20, `#B9B9B9`): „First time? Create account” / „Back to Sign in”.
6. Legal
   - Mały tekst (12/18, `#B9B9B9`), linki do `Privacy` i `Terms` (web). Jedna linijka, nie dwie.

Zasada: jeden główny CTA na ekranie. Reszta mniej dominująca pod nim.

## 6) Stany i walidacja
- Loading: spinner w przycisku (label znika, kolor spinnera `#0B0B0B`).
- Disabled CTA: tło `#2A2A2A`, label `#777777` (kontrast ≥ 4.5:1 do tła ekranu).
- Error (inline nad CTA): `#F87171` (krótko, bez żargonu).
- Focus w polach: obrys `#27D969` 1–2 px.
- Haptics: `ImpactFeedbackStyle.Light` przy głównym CTA.

## 7) Kopie i ton (EN – można zlokalizować)
- Header (login): „WELCOME BACK”
- Header (sign‑up): „CREATE ACCOUNT”
- Email placeholder: „Email”
- Password placeholder: „Password”
- Primary CTA: „Sign in” / „Create account”
- Google: „Continue with Google”
- Link: „First time? Create account” / „Back to Sign in”
- Error: „Please check your email and password.” lub zhumanizowany błąd Firebase.

Ton: krótki, sprawczy, przyjacielski.

## 8) Nawigacja
- Splash → Auth (ten ekran).
- Login success → jeśli `consented: true` → Home (`/`).
- Login success → jeśli `consented: false` → Consents (`/consents`).
- Sign‑up success → Consents.
- Linki: `privacy`, `terms` (hostowane w `web/`).

## 9) A11y
- Kontrast tekstów ≥ WCAG AA.
- Etykiety inputów czytane przez screen reader.
- Role: primary CTA `accessibilityRole="button"`.
- Kolejność fokusu: wordmark → H1 → Email → Password → CTA → Secondary → Legal.

## 10) Wskazówki implementacyjne (React Native / Expo)
- Wykorzystaj istniejące pliki `app/(auth)/signin.tsx` i `signup.tsx` (logika Firebase gotowa).
- Zachowaj guardy z `app/_layout.tsx` (auth + consents).
- Styluj spójnie do Splash: tło `#000000`, typografia i spacing jak wyżej.
- Haptics: `expo-haptics` przy primary CTA.
- StatusBar: `light`.

## 11) Do / Don’t
- Do: jeden mocny CTA; czytelna hierarchia; minimum opcji logowania.
- Don’t: więcej niż jeden primary CTA; wielokolorowe akcenty; długie teksty; font < 14 pt.

## 12) Handoff checklist
- [ ] Tło i status bar zgodne ze Splash.
- [ ] Spacing: padding L/R = 24; pionowe 8/16/24.
- [ ] Primary CTA `#27D969`, h=56, r=28, label center.
- [ ] Pola z czytelnym kontrastem; focus w zieleni.
- [ ] Secondary Google + linki legal.
- [ ] Loading/disabled/error zaimplementowane.
- [ ] Haptics na CTA.
- [ ] A11y role i kolejność fokusu.

---

Jeśli dodajemy mini‑ilustrację u góry, trzymajmy biel na czarnym i prosty flat styl, by nie konkurowała ze Splash.

