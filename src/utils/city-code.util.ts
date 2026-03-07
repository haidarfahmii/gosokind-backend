import rawCityCodes from "../config/city-codes.json";

const cityCodes = rawCityCodes as Record<string, string>;

export function getCityCode(city: string): string {
  if (!city) return "UNK";

  const normalized = city
    .trim()
    .toUpperCase()
    .replace(/[^A-Z\s]/g, "");

  if (cityCodes[normalized]) {
    return cityCodes[normalized];
  }

  const fallback = normalized.replace(/[AEIOU\s]/g, "").substring(0, 6);

  return fallback || "UNK";
}
