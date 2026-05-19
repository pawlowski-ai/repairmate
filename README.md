# RepairMate / MendWise

RepairMate, currently branded in parts of the product as MendWise, is an AI-powered mobile repair assistant for diagnosing common home and car problems from a short text description and, optionally, a photo.

The repository is an Expo + React Native application backed by Firebase and a Gemini-powered Cloud Function. It is built as a practical AI product prototype: describe what is broken, get a likely diagnosis, ask for an alternative diagnosis if the first one is wrong, then continue into step-by-step repair guidance.

## What It Does

- accepts natural-language repair problems from the user
- supports optional camera or image-library uploads for visual diagnosis context
- sends diagnosis requests to a Firebase Cloud Function using Gemini
- returns a concise likely diagnosis
- supports an alternative diagnosis flow when the user rejects the first answer
- generates follow-up repair steps from the accepted diagnosis
- handles authentication and consent gating through Firebase
- includes usage limits and a RevenueCat-backed paywall screen
- includes public web privacy and terms pages

## Why This Project Matters

This project is a portfolio proof point for AI workflow and AI product operations work, not just mobile UI work.

It demonstrates:

- prompt and system-instruction design for a bounded AI assistant
- model-output workflows: validation, diagnosis, alternative diagnosis, repair steps, and chat
- safety-aware user guidance for repair scenarios where bad advice could matter
- practical integration of Gemini, Firebase Auth, Firestore, Cloud Functions, and RevenueCat
- product thinking around onboarding, consent, usage metering, paywall behavior, and public legal pages
- shipping a complete AI-assisted user flow with mobile and web-facing surfaces

## Core Stack

- Expo 53
- React Native 0.79
- TypeScript
- Expo Router
- Firebase Auth
- Firestore
- Firebase Cloud Functions
- Google Gemini via `@google/generative-ai`
- RevenueCat / `react-native-purchases`
- Expo Image Picker

## Key Files

- `app/index.tsx` - main problem intake screen with text and image input
- `app/diagnosis.tsx` - diagnosis result and alternative diagnosis flow
- `app/steps.tsx` - repair steps flow after a diagnosis is accepted
- `services/geminiService.ts` - client-side AI workflow wrapper
- `services/api.ts` - backend call wrapper and paywall/sign-in handling
- `functions/index.js` - Firebase Cloud Function that calls Gemini
- `constants/index.ts` - system instructions and safety/product copy
- `app/paywall.tsx` - RevenueCat paywall screen
- `app/consents.tsx` - consent gate
- `web/privacy.html` and `web/terms.html` - public legal pages

## Running Locally

Install dependencies:

```bash
npm install
```

Start the Expo app:

```bash
npx expo start
```

Run on web:

```bash
npm run web
```

The full AI flow requires configured Firebase, Gemini, and RevenueCat credentials. Local UI development can still be done with the Expo development server, but production diagnosis calls depend on the Firebase Cloud Function and the configured Gemini secret.

## Current Status

This is an MVP-stage AI product prototype. The repo contains the main mobile app, Firebase function, product docs, brand notes, legal pages, and setup checklists. It is intended to show practical AI workflow execution, prompt-controlled product behavior, and end-to-end product thinking around an AI assistant.
