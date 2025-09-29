import stringSimilarity from "string-similarity";

export const REF_RANGES = {
  Hemoglobin: { low: 12.0, high: 15.0 },
  WBC: { low: 4000, high: 11000 },
  Platelets: { low: 150000, high: 450000 } // added
};

export const TEST_ALIASES = {
  Hemoglobin: ["Hb", "Hemglobin", "Haemoglobin"],
  WBC: ["White Blood Cell", "White Blood Cells", "WBCs"],
  Platelets: ["Platelet Count", "PLT", "Platelets"] // added
};


// --- helpers ---
export function parseNumeric(x) {
  if (typeof x === "number") return x;
  if (!x) return null;
  // Remove spaces and keep digits, commas, dots
  const cleaned = String(x).replace(/\s/g, '').replace(/,/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}


export function cleanUnit(u) {
  if (!u) return null;
  return u
    .replace(/µ/g, "u")
    .replace(/\s/g, "")
    .replace(/\/ul/i, "/uL")
    .replace(/\/μl/i, "/uL")
    .replace(/g\/dl/i, "g/dL");
}

export function bestCanonicalName(raw) {
  const canonicals = Object.keys(TEST_ALIASES);
  const candidates = canonicals.flatMap(c => [c, ...TEST_ALIASES[c]]);
  const match = stringSimilarity.findBestMatch(raw, candidates);
  const best = match.bestMatch.target;
  const canonical =
    canonicals.find(c => c === best) ||
    canonicals.find(c => TEST_ALIASES[c].includes(best));
  return { canonical: canonical || raw, rating: match.bestMatch.rating };
}

export function statusFromRange(name, value) {
  const rr = REF_RANGES[name];
  if (!rr || value == null) return null;
  if (value < rr.low) return "low";
  if (value > rr.high) return "high";
  return "normal";
}
