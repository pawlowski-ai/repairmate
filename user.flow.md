# MendWise – User Flow (MVP)

## Nowy użytkownik (niezalogowany)

1. **Splash**
   - → Auth

2. **Auth (Login / Sign-up)**
   - Opcja: Log in → Home
   - Opcja: Sign up → Consents

3. **Consents**
   - → Onboarding 1

4. **Onboarding 1**
   - → Onboarding 2

5. **Onboarding 2**
   - → Onboarding 3

6. **Onboarding 3**
   - → Home

---

## Powracający użytkownik (już zalogowany)

1. **App Launch**
   - → Home

---

## Wspólny flow (po wejściu do Home)

1. **Home**
   - → Chat Input
   - → Drawer Menu

2. **Drawer Menu**
   - → Plan / Usage Status
   - → Privacy Policy (web link)
   - → Logout
   - → Back to Home

3. **Chat Input**
   - Opcja: Camera / Gallery → Diagnosis
   - Opcja: Describe Issue → Diagnosis

4. **Diagnosis**
   - Opcja: Accept → Fix Steps
   - Opcja: Reject → Diagnosis (alternatywna odpowiedź)

5. **Fix Steps**
   - Opcja: Step Follow-up Input → Step Follow-up Chat → powrót do Fix Steps
   - Opcja: Global Chat → powrót do Fix Steps
   - Opcja: I fixed it → Home

---

## Paywall
- Po 5 darmowych interakcjach (przy próbie 6) → Paywall (RevenueCat).
- Z Paywalla → powrót do ekranu, z którego został wywołany.
