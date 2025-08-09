const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } = require("@google/generative-ai");
const cors = require("cors")({ origin: true });

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

    const { prompt, imageBase64, systemInstruction } = req.body || {};
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).send("Missing 'prompt' in request body");
    }

    if (!GEMINI_API_KEY.value()) {
      return res.status(500).json({ error: "Missing GEMINI_API_KEY secret" });
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
