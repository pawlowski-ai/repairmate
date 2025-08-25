const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } = require("@google/generative-ai");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });

try { admin.initializeApp(); } catch {}

// Safety settings
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

// Secret: set via `firebase functions:secrets:set GEMINI_API_KEY`
const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");

exports.generateDiagnosis = onRequest({ region: "us-central1", invoker: "public", secrets: [GEMINI_API_KEY] }, (req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).send("Only POST requests are accepted");
    }

    // 1) Auth: verify Firebase ID token
    const authHeader = req.headers.authorization || "";
    const match = authHeader.match(/^Bearer (.+)$/i);
    if (!match) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    let uid;
    try {
      const decoded = await admin.auth().verifyIdToken(match[1]);
      uid = decoded.uid;
    } catch (e) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const { prompt, imageBase64, systemInstruction, interactionId } = req.body || {};

    const actionType = typeof systemInstruction === 'string'
      ? (systemInstruction.includes('validation') || systemInstruction.includes('classification')) ? 'validate'
        : systemInstruction.includes('STEPS') ? 'steps'
        : systemInstruction.includes('CHAT') ? 'chat'
        : 'diagnosis'
      : 'diagnosis';

    // Entry log (without sensitive content)
    try {
      console.log(JSON.stringify({
        at: 'ENTRY', uid, interactionId: interactionId || null, actionType,
        hasImage: Boolean(imageBase64), promptLen: typeof prompt === 'string' ? prompt.length : 0
      }));
    } catch {}
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).send("Missing 'prompt' in request body");
    }

    if (!GEMINI_API_KEY.value()) {
      return res.status(500).json({ error: "Missing GEMINI_API_KEY secret" });
    }

    // 2) Limiter: transactional increment in users/{uid} (liczymy wszystko)
    const db = admin.firestore();
    try {
      await db.runTransaction(async (tx) => {
        const ref = db.collection('users').doc(uid);
        const snap = await tx.get(ref);
        const existing = snap.exists ? snap.data() : {};
        const plan = existing?.plan || 'free';
        const callsTotal = typeof existing?.callsTotal === 'number' ? existing.callsTotal : 0;
        // Idempotencja: jeśli interactionId już widziane, nie zliczaj ponownie
        const recentIds = Array.isArray(existing?.recentInteractionIds) ? existing.recentInteractionIds : [];
        const alreadySeen = interactionId && recentIds.includes(interactionId);
        try {
          console.log(JSON.stringify({ at: 'TX_READ', uid, interactionId: interactionId || null, actionType, plan, callsTotal, alreadySeen }));
        } catch {}

        if (plan === 'free' && callsTotal >= 5 && !alreadySeen) {
          try {
            console.log(JSON.stringify({ at: 'LIMIT', uid, interactionId: interactionId || null, actionType, callsTotal }));
          } catch {}
          const err = new Error('LIMIT_EXCEEDED');
          err.code = 'LIMIT_EXCEEDED';
          throw err;
        }
        const next = {
          plan,
          callsTotal: alreadySeen ? callsTotal : callsTotal + 1,
          consented: existing?.consented === true || false,
          createdAt: snap.exists ? (existing.createdAt || admin.firestore.FieldValue.serverTimestamp()) : admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        // Aktualizuj listę recentInteractionIds (przycięta do 20 ostatnich)
        if (interactionId && !alreadySeen) {
          const updated = recentIds.concat(interactionId);
          next.recentInteractionIds = updated.slice(-20);
        }
        tx.set(ref, next, { merge: true });
        try {
          console.log(JSON.stringify({ at: 'TX_WRITE', uid, interactionId: interactionId || null, actionType, callsTotalBefore: callsTotal, callsTotalAfter: next.callsTotal }));
        } catch {}
      });
    } catch (limitErr) {
      if (limitErr && (limitErr.code === 'LIMIT_EXCEEDED' || String(limitErr.message).includes('LIMIT_EXCEEDED'))) {
        return res.status(402).json({ error: 'LIMIT_EXCEEDED' });
      }
      console.error('Limiter error:', limitErr);
      return res.status(500).json({ error: 'Limiter error' });
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY.value());
    const modelOptions = { model: "gemini-2.5-flash", safetySettings };
    if (systemInstruction && typeof systemInstruction === "string") {
      modelOptions.systemInstruction = systemInstruction;
    }

    const model = genAI.getGenerativeModel(modelOptions);

    try {
      const parts = [{ text: prompt }];
      if (imageBase64 && typeof imageBase64 === "string") {
        const [meta, data] = imageBase64.split(',');
        const mimeMatch = meta && meta.match(/:(.*?);/);
        const mimeType = mimeMatch && mimeMatch[1] ? mimeMatch[1] : undefined;
        if (mimeType && data) {
          parts.push({ inlineData: { mimeType, data } });
        }
      }

      const result = await model.generateContent(parts);
      const response = await result.response;
      const text = await response.text();
      try {
        console.log(JSON.stringify({ at: 'OK', uid, interactionId: interactionId || null, actionType }));
      } catch {}
      res.status(200).json({ result: text });
    } catch (err) {
      console.error("AI error:", err);
      const status = err && err.status ? Number(err.status) : 500;
      const payload = {
        error: err && err.statusText ? String(err.statusText) : 'AI error',
        details: err && err.errorDetails ? err.errorDetails : undefined,
      };
      res.status(status).json(payload);
    }
  });
});
