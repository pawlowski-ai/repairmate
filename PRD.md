# PRD: RepairMate – AI-Powered Repair Assistant (MVP)

## 1. Product overview

### 1.1 Document title and version
- PRD: RepairMate – AI-Powered Repair Assistant (MVP)
- Version: 1.1

### 1.2 Product summary

RepairMate is a lightweight mobile application that helps users diagnose and repair common household and automotive issues using AI. It leverages the Gemini API (via a wrapper) to provide structured repair instructions based on user-submitted text and, optionally, images.

This PRD outlines the requirements for the MVP version of the app, focusing strictly on essential functionality: core AI repair flow, user authentication, usage metering, and a subscription paywall. The MVP avoids extra features such as data tracking, logging, user history, or external resources. It is designed to validate user need, functionality, and monetization potential before expanding further.

## 2. Goals

### 2.1 Business goals
- Deploy a functional MVP to Google Play and App Store.
- Achieve first 500 free users and 50 Pro subscriptions.
- Validate willingness to pay for AI-based repair assistance.
- Build a stable foundation for future development.

### 2.2 User goals
- Get quick, understandable help in fixing household or automotive issues.
- Use natural language to describe a problem and receive a diagnosis.
- Follow clear, step-by-step instructions to fix it without external help.

### 2.3 Non-goals
- Human support or live chat.
- Tracking of common issues or analytics.
- Repair history, logs, content saving or bookmarking.
- Education, video, PDF tutorials.
- Feature parity with full repair platforms.

## 3. User personas

### 3.1 Key user types
- DIY-oriented young adults
- Renters or students in new apartments
- Budget-conscious car owners
- People with little or no repair experience

### 3.2 Basic persona details
- **Alex**: 24-year-old student who struggles with small appliance failures.
- **Jordan**: 31-year-old car owner looking to avoid costly mechanic visits.
- **Sam**: 27-year-old sharing a flat, eager to fix small things independently.

### 3.3 Role-based access
- **Registered User**: Must register on first launch (via Google). Gets 3 free AI interactions.
- **Pro User**: Paid subscription ($15/month) for unlimited AI access.

## 4. Functional requirements

- **AI-powered repair assistant** (Priority: High)
  - Accepts user-entered problem description (required).
  - Accepts optional image upload.
  - Sends prompt to Gemini API.
  - Returns structured response with a diagnosis.

- **Step-by-step repair instructions** (Priority: High)
  - After accepting the diagnosis, user receives repair steps.
  - Each step is displayed as a section with a follow-up option.

- **Alternative diagnosis option** (Priority: High)
  - User can reject diagnosis and request an alternative.
  - This triggers another AI call and counts toward usage.

- **Usage metering** (Priority: High)
  - Tracks and displays number of AI interactions used.
  - Lock use after 3 interactions unless upgraded.

- **Authentication** (Priority: High)
  - Mandatory Google login on first launch.
  - Firebase Auth handles identity and session tracking.

- **Onboarding & terms acceptance** (Priority: Medium)
  - Simple onboarding sequence (welcome, how it works, terms).
  - Acceptance required before proceeding.

- **Upgrade to Pro** (Priority: High)
  - Paywall appears after 3 interactions.
  - Links to App Store / Play Store for subscription purchase.

- **Account screen** (Priority: Low)
  - Displays current plan (Free or Pro).
  - Shows interaction usage.
  - Links to privacy policy and terms of use.

## 5. User experience

### 5.1 Entry points & first-time user flow
- App launches to registration screen.
- Onboarding carousel with how-it-works slides.
- User must log in with Google and accept terms.

### 5.2 Core experience
- **Open app**: User sees clean interface with description field and optional image upload.
- **Describe issue**: User types the problem and (optionally) uploads an image.
- **Receive diagnosis**: AI responds with probable cause.
- **Choose next step**:
  - [Accept diagnosis] → view repair steps.
  - [Not it, show another option] → next diagnosis (new interaction).
- **Follow-up**: Each repair step has a follow-up input (uses final interaction slot if free).

### 5.3 Advanced features & edge cases
- Image not required — pure text submission is valid.
- Inappropriate content flagged/blocked by system prompt.
- Empty prompt or misuse still triggers an interaction cost.
- App requires internet connection — no offline functionality.

### 5.4 UI/UX highlights
- Minimalist, trust-inspiring interface.
- Section-based repair steps with expandable containers.
- Visual indicator of remaining free interactions.
- Simple paywall and upgrade screen.

## 6. Narrative

Alex is a student who finds their washing machine leaking. Not knowing where to begin, they open RepairMate, type "leaking under the door," and hit submit. The app quickly responds: it's likely a worn gasket. With one more tap, RepairMate walks Alex through each step to replace it. After three free uses, Alex upgrades — knowing this app just saved them hundreds.

## 7. Success metrics

### 7.1 User-centric metrics
- AI response time under 10 seconds.
- % of users who complete at least one full repair.
- Subscription conversion rate after 3 uses.

### 7.2 Business metrics
- Free → Pro conversion rate (>10%).
- App retention (D1, D7).
- Acquisition cost per install (CPI/CAC).

### 7.3 Technical metrics
- API uptime >99.9%
- Crash-free sessions >99%
- API latency <1.5s

## 8. Technical considerations

### 8.1 Integration points
- Gemini API via wrapper.
- Firebase Auth for login.
- Firebase Firestore for usage tracking.
- App Store / Play Store for subscription payments.

### 8.2 Data storage & privacy
- No long-term data storage for user content.
- GDPR/RODO-compliant onboarding and permissions.
- All prompts/images are ephemeral.

### 8.3 Scalability & performance
- Expo + Firebase stack for fast prototyping.
- Backend needed to securely handle API key and future expansion.
- MVP backend does not yet exist.

### 8.4 Potential challenges
- Model hallucinations or inaccurate suggestions.
- App store rejection (due to functionality or permissions).
- Key abuse without backend wrapper.
- No crash/error analytics in v1.

## 9. Milestones & sequencing

### 9.1 Project estimate
- Medium: 3–5 weeks

### 9.2 Team size & composition
- Medium Team: 2–3 total people
  - 1 product manager (you)
  - 1 React Native dev (Expo)
  - 1 designer or frontend support
  - QA handled via Firebase Test Lab

### 9.3 Suggested phases
- **Phase 1**: Finalize UI, onboarding, and login flow (1 week)
  - Deliverables: screen flow, Google login, onboarding slides
- **Phase 2**: AI wrapper integration + interaction logic (2 weeks)
  - Deliverables: prompt system, call tracking, diagnosis flow
- **Phase 3**: Paywall + backend + release (1–2 weeks)
  - Deliverables: secure API key handling, store submission, monetization

## 10. User stories

### 10.1. Submit issue with or without image
- **ID**: US-001
- **Description**: As a user, I want to describe my issue (and optionally upload a photo) to receive a diagnosis.
- **Acceptance criteria**:
  - Text description is required.
  - Image upload is optional.
  - AI call is triggered on submission.

### 10.2. Receive and accept diagnosis
- **ID**: US-002
- **Description**: As a user, I want to receive a clear diagnosis from the AI so I can understand the problem.
- **Acceptance criteria**:
  - AI provides one likely cause.
  - User can accept or reject the suggestion.
  - Each answer = 1 interaction.

### 10.3. View repair steps
- **ID**: US-003
- **Description**: As a user, I want step-by-step instructions after accepting a diagnosis so I can try to fix it.
- **Acceptance criteria**:
  - Steps displayed in collapsible containers.
  - Each step has a “follow-up” option.
  - Triggering follow-up = 1 interaction.

### 10.4. See remaining interaction count
- **ID**: US-004
- **Description**: As a user, I want to see how many free interactions I have left.
- **Acceptance criteria**:
  - Counter visible on main screen.
  - Counter updates in real time.

### 10.5. Trigger paywall after limit
- **ID**: US-005
- **Description**: As a user, I want to be prompted to upgrade after my free uses run out.
- **Acceptance criteria**:
  - After 3 interactions, AI is blocked.
  - Upgrade screen appears automatically.

### 10.6. Upgrade to Pro
- **ID**: US-006
- **Description**: As a user, I want to pay for unlimited access via subscription.
- **Acceptance criteria**:
  - App supports in-app purchase.
  - Plan status updates to Pro.

### 10.7. View plan and account
- **ID**: US-007
- **Description**: As a user, I want to see my plan and terms from the account screen.
- **Acceptance criteria**:
  - Free/Pro plan status visible.
  - Link to terms and privacy.

### 10.8. Ensure secure login and tracking
- **ID**: US-008
- **Description**: As a developer, I want user auth via Google so usage can be tracked securely.
- **Acceptance criteria**:
  - Firebase Auth in place.
  - All interactions linked to UID.

### 10.9. Handle invalid prompts or misuse
- **ID**: US-009
- **Description**: As a user, I want to be informed if my input is invalid or blocked.
- **Acceptance criteria**:
  - If prompt is empty or abusive, AI blocks and responds.
  - Still counts as an interaction.
