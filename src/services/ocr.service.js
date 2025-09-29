import Tesseract from "tesseract.js";
import { geminiModel } from "../config/gemini.js";

function splitLines(text) {
  return text
    .split(/\r?\n|,/)
    .map(s => s.replace(/\.+/g, " ").trim())  // remove dot leaders
    .filter(Boolean);
}


async function cleanWithGemini(lines) {
  // If no key or no lines, just return original
  if (!lines.length || !process.env.GEMINI_API_KEY) return lines;

  const prompt = `
You are a medical text cleaner. 
Fix spelling errors in test names, units, and High/Low markers but DO NOT add new tests.
Return each corrected line, one per line, keeping numeric values unchanged.

Lines:
${lines.map(l => `- ${l}`).join("\n")}
  `;

  try {
    const resp = await geminiModel.generateContent(prompt);
    const text = resp.response.text();

    // Remove markdown fences if model wrapped output
    const cleaned = text
      .replace(/```json|```/g, "")
      .split(/\r?\n/)
      .map(l => l.replace(/^[-*]\s*/, "").trim())
      .filter(Boolean);

    // If Gemini returned nothing, keep original
    return cleaned.length ? cleaned : lines;
  } catch (e) {
    console.error("Gemini cleanup failed:", e.message);
    return lines; // fallback if Gemini call fails
  }
}

export const extractFromText = async (text) => {
  if (!text) return { tests_raw: [], confidence: 0 };

  const lines = splitLines(text);
  const cleaned = await cleanWithGemini(lines);

  return {
    tests_raw: cleaned,
    confidence: Number((cleaned.length / Math.max(1, lines.length)).toFixed(2))
  };
};

export const extractFromImage = async (path) => {
  const { data } = await Tesseract.recognize(path, "eng");
  const lines = splitLines(data.text || "");
  const cleaned = await cleanWithGemini(lines);
  console.log("OCR RAW TEXT:", data.text);

  return {
    tests_raw: cleaned,
    confidence: Number((cleaned.length / Math.max(1, lines.length)).toFixed(2))
  };
};

