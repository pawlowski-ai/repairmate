# MendWise

**AI repair guidance for home and car problems.**

MendWise is an Expo + React Native mobile app that helps users describe a broken appliance, household issue, or car problem and receive a clear AI-assisted diagnosis. Users can submit text, add a photo, ask for an alternative diagnosis, and continue into step-by-step repair guidance.

The project is built as a practical AI product prototype, not just a UI demo. It combines a mobile app, Firebase authentication and usage tracking, a Gemini-backed Cloud Function, consent gating, public legal pages, and a RevenueCat subscription flow.

## Product Flow

1. User describes what is broken or uploads a photo.
2. MendWise sends the request to a Firebase Cloud Function.
3. Gemini returns a concise likely diagnosis under a bounded repair-assistant prompt.
4. User can accept the diagnosis, request a different plausible diagnosis, or continue into repair steps.
5. The app generates structured, beginner-friendly repair instructions and supports follow-up questions.
6. Free usage is metered; paid access is handled through RevenueCat.

## What This Demonstrates

- AI product workflow design from intake to diagnosis to repair steps
- prompt and system-instruction design for a bounded assistant
- model safety thinking for repair advice where overconfident guidance can create risk
- multimodal UX using text plus optional image input
- Firebase Auth, Firestore, Cloud Functions, and hosted legal pages
- RevenueCat paywall integration and subscription-state handling
- mobile app delivery with Expo, React Native, TypeScript, and Expo Router

## Core Stack

| Area | Stack |
| --- | --- |
| Mobile | Expo 53, React Native 0.79, TypeScript, Expo Router |
| AI | Gemini 2.5 Flash via Firebase Cloud Function |
| Backend | Firebase Auth, Firestore, Cloud Functions, Firebase Hosting |
| Monetization | RevenueCat, in-app purchases |
| Media | Expo Image Picker, camera and gallery upload |
| Web | Static privacy, terms, and landing pages |

## Key Files

| File | Purpose |
| --- | --- |
| `app/index.tsx` | Problem intake screen with text and image input |
| `app/diagnosis.tsx` | Diagnosis result and alternative diagnosis flow |
| `app/steps.tsx` | Repair-step generation and display |
| `services/geminiService.ts` | Client-side AI workflow wrapper |
| `services/api.ts` | Authenticated backend call wrapper |
| `functions/index.js` | Firebase Cloud Function that calls Gemini |
| `constants/index.ts` | App copy, repair-assistant prompts, and response parsing |
| `app/paywall.tsx` | RevenueCat paywall screen |
| `app/consents.tsx` | Consent gate |
| `web/privacy.html`, `web/terms.html` | Public legal pages |

## Security Notes

The Gemini API key is not stored in the mobile client. It is loaded as a Firebase Functions secret and accessed server-side in `functions/index.js`.

Firebase client configuration files such as `firebaseConfig.ts` and `google-services.json` contain public client identifiers required by Firebase apps. They should still be protected through Firebase Security Rules, Google Cloud API restrictions, and authorized domain/package configuration.

RevenueCat SDK keys are loaded from Expo public environment variables and are intentionally not hardcoded in source. See `.env.example`.

## Local Development

Install dependencies:

```bash
npm install
```

Create local environment variables:

```bash
cp .env.example .env.local
```

Set the RevenueCat public SDK keys:

```bash
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=your_ios_public_sdk_key
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=your_android_public_sdk_key
```

Start the Expo app:

```bash
npx expo start
```

Run on web:

```bash
npm run web
```

The complete AI diagnosis flow requires configured Firebase, Gemini, and RevenueCat services. Local UI work can run through Expo, but production diagnosis calls depend on the deployed Firebase Cloud Function and configured Gemini secret.

## Current Status

MendWise is an MVP-stage AI product prototype. The repository contains the main mobile app, Firebase function, product docs, brand notes, legal pages, setup checklists, and web-facing pages. It is intended to show practical AI workflow execution, safety-aware prompt design, and end-to-end product thinking around an AI assistant.
