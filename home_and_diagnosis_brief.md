# Mendwise – Home & Diagnosis Screens Brief (Design + Implementation)

This brief aligns with brand, UX, and technical foundations already shipped (Splash, Auth, Consents, Onboarding). Use it to design and implement the Home and Diagnosis experiences consistently and efficiently.

## 1) Meta
- Screen group: Home (input) and Diagnosis (result + next decision)
- Stack: Expo Router (RN), Firebase Auth/Firestore, Cloud Functions wrapper to Gemini
- File targets:
  - `app/index.tsx` (Home)
  - `app/diagnosis.tsx` (Diagnosis)
  - Shared UI in `components/`
  - Services in `services/geminiService.ts`, `services/api.ts`, `services/firebase.ts`

## 2) Goals
- Home: quick start – describe an issue or add a photo, submit to AI
- Diagnosis: show most likely cause; user accepts (go to Steps) or rejects (ask for alternative)
- Keep the experience minimal, readable, and brand‑consistent

## 3) Brand & Visual System (global)
- Background: `#000000` (dark)
- Text: Title `#FFFFFF`, body `#B9B9B9`
- Primary CTA: fill `#27D969`, label `#0B0B0B`
- Spacing: horizontal padding 24; vertical rhythm 8/16/24 (4‑pt)
- Typography (Inter):
  - H1: 28/34 (Black or Semibold), letterSpacing 0.2
  - Body: 14/20 Regular
  - Button: 18/22 Semibold (or 16/20 for small/tic‑tac)
- StatusBar: light; Safe Area mandatory; one primary CTA per screen
- Motion: subtle haptics on primary actions (`Impact Light`), no heavy animations

## 4) Home Screen (Input)
### 4.1 Purpose
- Let users start a repair by describing an issue and optionally attaching a photo.

### 4.2 Layout (portrait, responsive)
- Top: small headline like “Ready to fix something?” (H1)
- Below: input choice section:
  - Text `TextInput` (multiline, placeholder e.g. “My washing machine won’t drain water.”)
  - Optional camera/gallery button (leading icon)
- Primary CTA (full width, 56h, r=28): “Start a repair”
- Bottom padding: `max(16, insets.bottom)`

### 4.3 Interactions
- Validation: description required OR photo present
- On Submit:
  - Call `validateIsRepairQuery` then `diagnoseIssue` via `services/geminiService.ts`
  - Each call automatically uses `interactionId` and adds the `Authorization: Bearer <ID token>` header (wrapper)
  - Loading: block CTA, show spinner
  - Success → `router.push('/diagnosis')` with payload (or shared state)
- Error states:
  - 401 → auto redirect to `'/signin'` (handled by wrapper)
  - 402 (limit) → auto redirect to `'/paywall'`
  - Network/model error → inline message and keep data in input
- Haptics on submit; debounce multiple taps
- Accessibility: labels, placeholder, hit slop, dark contrast

### 4.4 Data & Security
- No API key on device – only call the backend function (already shipped)
- Do not store prompts/images long‑term
- Image picker: request permissions on demand; compress to reasonable size

## 5) Diagnosis Screen
### 5.1 Purpose
- Present the most likely cause (from AI). Let the user:
  - Accept → proceed to step‑by‑step instructions (`/steps`)
  - Not it → request alternative diagnosis (counts as a new interaction)

### 5.2 Layout
- Header: title “Here’s what I think is wrong:” (H1 small)
- Card container (rounded, subtle border or elevated):
  - Problem summary (user input excerpt)
  - “Likely cause” body text (clear, concise)
- Actions:
  - Primary CTA: “Looks right — show me how to fix it” (full width)
  - Secondary text button: “Not it — try another diagnosis”
- Optional: small line with remaining free interactions (read‑only)

### 5.3 Interactions
- Accept:
  - Call `getRepairSteps` via `geminiService` (counts interaction)
  - Navigate `router.push('/steps')`
- Reject (alternative):
  - Call `diagnoseIssue` again with context (counts interaction)
  - Replace current result (stay on `/diagnosis`)
- Guards:
  - Anti‑double‑tap with ref/debounce
  - Handle wrapper redirects for 401/402

## 6) Functional Constraints (from PRD)
- Free interactions (limit controlled server‑side). UI assumes auto redirect to Paywall on 402.
- No long‑term storage of content/images
- Quick response; clear errors; safety nudges only

## 7) Copy (suggested; adapt to design)
- Home
  - H1: “Ready to fix something?”
  - CTA: “Start a repair”
- Diagnosis
  - System line: “Here’s what I think is wrong:”
  - CTA primary: “Looks right — show me how to fix it”
  - CTA secondary: “Not it — try another diagnosis”

## 8) Implementation Notes
- Use existing wrappers:
  - `services/api.ts` handles ID token and 401/402 navigation
  - `services/geminiService.ts` exposes `validateIsRepairQuery`, `diagnoseIssue`, `getRepairSteps`, `getChatResponse`
- Always pass unique `interactionId` (service already does)
- Avoid StrictMode double calls: keep action guards (e.g., ref debounce)
- Keep dark theme tokens consistent with `UI_FOUNDATION_SUMMARY.md`

## 9) Navigation Flow
- After login/consents/onboarding → `/` (Home)
- Submit → `/diagnosis`
- Accept → `/steps`
- Reject → stays `/diagnosis` (alternate)
- Limit → `/paywall` (auto)

## 10) Handoff Checklist (Design + Dev)
- [ ] Background `#000000`, StatusBar light, SafeArea used
- [ ] Home: input (text/photo), suggestion chips, primary CTA, optional meter
- [ ] Validation & loading states; haptics on CTA; debounce
- [ ] Diagnosis: cause card, primary/secondary CTAs
- [ ] Redirect handling (401/402) confirmed
- [ ] Interaction count triggered only by backend wrapper calls
- [ ] Accessibility: roles, labels, min hit area, contrast
- [ ] No analytics or persistence beyond minimal session data
- [ ] Copy reviewed per brand tone (direct, supportive, everyday)

## 11) Risks & Edge Cases
- No connectivity → show offline message and keep input
- Inappropriate content → block message (from backend); still counts as interaction
- Huge images → compress or warn

## 12) References
- Brand: `brand_vision.md`
- UI foundation: `UI_FOUNDATION_SUMMARY.md`
- PRD: `PRD.md`
- Routing/guards: `app/_layout.tsx`
