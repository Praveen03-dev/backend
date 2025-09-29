import openai from "../config/openai.js";

export async function generatePatientSummary(tests) {
  const prompt = `
You are a medical report simplifier.
Explain the following lab results in simple language for a patient.
Do not diagnose or suggest treatment.
Do NOT add tests that are not in the list.

Tests JSON:
${JSON.stringify(tests, null, 2)}

Respond in JSON ONLY:
{
  "summary": "<one line overall>",
  "explanations": ["...", "..."]
}
`;

  try {
    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini", // or "gpt-4o", "gpt-3.5-turbo"
      messages: [
        { role: "system", content: "You are a helpful medical report simplifier." },
        { role: "user", content: prompt },
      ],
      temperature: 0.3, // keep responses stable & concise
    });

    const txt = resp.choices[0].message.content;

    // Remove markdown code fences if present
    const jsonStr = txt.replace(/```json|```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("OpenAI summary failed:", e.message);
    return {
      summary: "Unable to generate summary right now.",
      explanations: [],
    };
  }
}

