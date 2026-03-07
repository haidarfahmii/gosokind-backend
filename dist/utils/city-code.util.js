"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCityCode = getCityCode;
const city_codes_json_1 = __importDefault(require("../config/city-codes.json"));
const cityCodes = city_codes_json_1.default;
function getCityCode(city) {
    if (!city)
        return "UNK";
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
