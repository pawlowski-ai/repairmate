# Mendwise – Consents Screen Design Brief (Zgody / Terms & Privacy)

Źródło przepływu: patrz `user.flow.md` (po Sign‑up oraz po Sign‑in jeśli `consented: false`).

## 1) Cel ekranu
- **Rola:** zebranie wymaganych zgód prawnych przed wejściem do aplikacji.
- **Cel UX:** jednoznaczna informacja, minimum tarcia, szybkie „Continue”.
- **Nastrój:** ten sam co Auth/Splash – spokojna pewność, minimalizm, zero chaosu.

## 2) Device baseline i siatka
- Referencja: iPhone 15 Pro – 393×852 pt (dp). Skalować responsywnie.
- Safe Area: obowiązkowo (top/bottom).
- Padding poziomy: 24. Skala odstępów (4‑pt): 8 / 16 / 24.
- StatusBar: `light` na czarnym tle.

## 3) Kolory i typografia
- Tło: `#000000`.
- Tekst H1: `#FFFFFF` (Inter Black 28/34, all caps, letterSpacing 0.2).
- Body: `#B9B9B9` (Inter Regular 14/20).
- Primary CTA: `#27D969` (label `#0B0B0B`, Inter Semibold 18/22).
- Divider/obrys: `#2A2A2A`.

## 4) Layout sekcji (pionowo)
1. Header
   - H1: „BEFORE WE START”.
   - Krótki lead: 1–2 zdania o wymaganych zgodach.
2. Lista zgód
   - Zgoda wymagana (checkbox): „I accept the Terms and the Privacy Policy.”
     - Linki inline: „Terms” → `/terms`, „Privacy Policy” → `/privacy` (otwierane w WebView/Linking lub router → pliki `web/terms.html`, `web/privacy.html`).
   - Zgoda opcjonalna (checkbox): „I agree to receive product tips and updates.” (opcjonalna, domyślnie off).
3. Primary CTA
   - „Continue” – disabled, dopóki checkbox wymagany nie jest zaznaczony.
   - Wysokość 56, radius 28, pełna szerokość.
4. Secondary (opcjonalnie)
   - Tekstowy link „Back to Sign in”. Bez dominującej wagi.

## 5) Interakcje i stany
- Focus i aktywne elementy: obrys w `#27D969`.
- Disabled CTA: tło `#2A2A2A`, label `#777777`.
- Error: jeśli użytkownik spróbuje „Continue” bez wymaganej zgody → krótki, czerwony komunikat inline `#F87171`.
- Haptics: `ImpactFeedbackStyle.Light` przy „Continue”.
- Unikamy scroll‑jank – checklist ma się mieścić na ekranie; przy małych ekranach dopuszczamy przewijanie.

## 6) Nawigacja
- Wejście: po Sign‑up oraz po Sign‑in, jeśli `users/{uid}.consented !== true`.
- Wyjście (sukces): zapis `users/{uid}.consented = true` →
  - jeśli mamy onboarding: `router.replace('/onboarding/1')`;
  - na MVP bez onboardingu: `router.replace('/')`.
- Re‑entry: jeśli użytkownik zaloguje się później, a `consented: true`, guard w `app/_layout.tsx` przepuści go bez tego ekranu.

## 7) Wskazówki implementacyjne
- Dane: `users/{uid}` w Firestore – update pola `consented: true` (merge) + `updatedAt`.
- Źródła: `auth` i `db` z `services/firebase.ts` (jak w Auth), używamy `serverTimestamp()`.
- Guardy: brak cofania po sukcesie (używamy `router.replace`).
- Debounce: zabezpieczenie przed podwójnym tapem (stan `isLoading`, disable CTA).
- Linki prawne: użyj `router.push('/terms')` i `router.push('/privacy')` (serwowane z `web/`).
- Styl: identyczny token set jak Auth/Splash; jeden primary CTA; brak dodatkowych akcentów.

## 8) Kopie (EN – proponowane)
- H1: „BEFORE WE START”
- Lead: „We need your consent to continue. Please review and accept.”
- Checkbox (required): „I accept the Terms and the Privacy Policy.”
- Checkbox (optional): „I agree to receive product tips and updates.”
- CTA: „Continue”
- Secondary: „Back to Sign in”
- Error: „Please accept the required consent.”

## 9) A11y
- Checkboxy dostępne dla screen reader; etykiety czytelne.
- Czytelny focus order: H1 → lead → zgody (1→2) → CTA → Secondary.
- Kontrast zgodny z WCAG AA.

## 10) Do / Don’t
- Do: jedna oś decyzji; jasny status przycisku; linki inline.
- Don’t: ściana tekstu; wieloliniowe disclaimery; więcej niż 2 zgody.

## 11) Handoff checklist (Consents)
- [ ] Tło `#000000`, StatusBar `light`.
- [ ] Padding L/R = 24; skala 8/16/24.
- [ ] Checkbox required + optional; linki inline do `/terms`, `/privacy`.
- [ ] CTA „Continue” disabled do czasu zaznaczenia wymaganej zgody.
- [ ] Zapis `consented: true` do Firestore + `updatedAt`.
- [ ] Haptics na CTA; debounce wielokliku.
- [ ] A11y: role/etykiety; focus order.
- [ ] Nawigacja `replace` do Onboarding 1 (jeśli dostępny) lub `/`.