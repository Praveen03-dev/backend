import {
  REF_RANGES,
  cleanUnit,
  parseNumeric,
  bestCanonicalName,
  statusFromRange
} from "../utils/parser.js";

export const normalize = (testsRaw) => {
  const normalized = [];
  let scoreSum = 0, count = 0;

  for (const raw of testsRaw) {
    const matches = raw.matchAll(
      /(?:.*?:\s*)?([A-Za-z][A-Za-z \-\/]+?)\s+([\d,\.]+)\s*([A-Za-z\/µuL%]+)?(?:.*?\(([^)]+)\))?/gi
    );

    for (const m of matches) {
      const rawName = (m[1] || "").replace(/:$/, "").trim();
      const rawVal = parseNumeric(m[2]);
      const unit = cleanUnit(m[3] || null);
      const rawStatus = (m[4] || "").toLowerCase();

      const { canonical, rating } = bestCanonicalName(rawName);
      scoreSum += rating;
      count++;

      let status = statusFromRange(canonical, rawVal);
      if (!status && rawStatus) {
        if (rawStatus.includes("low")) status = "low";
        else if (rawStatus.includes("high") || rawStatus.includes("hgh")) status = "high";
      }

      if (!(canonical in REF_RANGES)) continue;

      normalized.push({
        name: canonical,
        value: rawVal,
        unit: unit,
        status: status || "normal",
        ref_range: REF_RANGES[canonical]
      });
    }
  }

  const normalization_confidence = normalized.length
    ? Math.max(
        0.6,
        Math.min(0.99, (scoreSum / Math.max(1, count)) * 0.8 + 0.2)
      )
    : 0.0;

  return {
    tests: normalized,
    normalization_confidence: Number(normalization_confidence.toFixed(2))
  };
};

export const guardrail = (testsRaw, normalized) => {
  const rawCanonicals = new Set();

  for (const line of testsRaw) {
    const matches = line.matchAll(/([A-Za-z][A-Za-z \-\/]+?)\s+[\d,\.]+/gi);
    for (const m of matches) {
      const { canonical } = bestCanonicalName(m[1].trim());
      rawCanonicals.add(canonical);
    }
  }

  for (const t of normalized) {
    if (!rawCanonicals.has(t.name)) {
      return { ok: false, reason: "hallucinated tests not present in input" };
    }
  }
  return { ok: true };
};



