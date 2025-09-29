import { extractFromText, extractFromImage } from "../services/ocr.service.js";
import { normalize, guardrail } from "../services/normalize.service.js";
import { generatePatientSummary } from "../services/aiSummary.service.js";

/**
 * Extract only (OCR or plain text) without normalization or summary
 */
export const extractReport = async (req, res, next) => {
  try {
    if (req.file) {
      const result = await extractFromImage(req.file.path);
      return res.json(result);
    }
    const { text } = req.body;
    const result = await extractFromText(text);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * Only normalization
 */
export const normalizeReport = (req, res, next) => {
  try {
    const { tests_raw } = req.body;
    if (!Array.isArray(tests_raw)) {
      return res.status(400).json({ error: "tests_raw must be array" });
    }

    const norm = normalize(tests_raw);
    const check = guardrail(tests_raw, norm.tests);
    if (!check.ok) {
      return res
        .status(422)
        .json({ status: "unprocessed", reason: check.reason });
    }

    res.json(norm);
  } catch (err) {
    next(err);
  }
};

/**
 * Only summary
 */
export const summarizeReport = async (req, res, next) => {
  try {
    const { tests } = req.body;
    if (!Array.isArray(tests)) {
      return res.status(400).json({ error: "tests must be array" });
    }
    const summary = await generatePatientSummary(tests);
    res.json(summary);
  } catch (err) {
    next(err);
  }
};

/**
 * Full pipeline: extract → normalize → guardrail → AI summary
 */
export const processReport = async (req, res, next) => {
  try {
    let tests_raw = [];

    console.log("BODY:", req.body);
    console.log("FILES:", req.file);

    // ✅ Case 1: tests_raw provided directly (JSON body)
    if (Array.isArray(req.body.tests_raw)) {
      // flatten & split any combined strings on commas OR newlines
      tests_raw = req.body.tests_raw.flatMap((item) =>
        String(item)
          .split(/\r?\n/)
          .map((s) => s.trim())
          .filter(Boolean)
      );

    // ✅ Case 2: plain text field (typed into textarea)
    } else if (req.body.text && !req.file) {
      tests_raw = req.body.text
        .split(/\r?\n/)
        .map((t) => t.trim())
        .filter(Boolean);

    // ✅ Case 3: image uploaded
    } else if (req.file) {
      const ocr = await extractFromImage(req.file.path);
      tests_raw = ocr.tests_raw;

    } else {
      return res
        .status(400)
        .json({ error: "Provide either tests_raw array, text, or file" });
    }

    console.log("After flatten+split:", tests_raw);

    // --- normalization & guardrail ---
    const norm = normalize(tests_raw);
    const check = guardrail(tests_raw, norm.tests);
    if (!check.ok) {
      return res
        .status(422)
        .json({ status: "unprocessed", reason: check.reason });
    }

    // --- AI summary ---
    const summary = await generatePatientSummary(norm.tests);

    res.json({
      tests: norm.tests,
      summary: summary.summary,
      explanations: summary.explanations,
      status: "ok",
    });
  } catch (err) {
    next(err);
  }
};
