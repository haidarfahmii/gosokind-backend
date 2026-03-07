"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveDateRange = resolveDateRange;
exports.formatPeriodLabel = formatPeriodLabel;
exports.groupOrdersByPeriod = groupOrdersByPeriod;
exports.resolveFilterOutletId = resolveFilterOutletId;
exports.fetchOutletInfo = fetchOutletInfo;
const prisma_config_1 = __importDefault(require("../config/prisma.config"));
const app_error_1 = require("./app-error");
/**
 * DATE HELPERS
 * Resolve date range dari query params.
 *
 * Rules:
 * - startDate tidak ada → default ke tanggal 1 bulan berjalan (00:00:00.000)
 * - endDate tidak ada   → default ke hari ini (23:59:59.999)
 * - Waktu di-set secara eksplisit agar range inklusif di kedua ujung
 *
 * @example
 * resolveDateRange("2025-01-01", "2025-01-31")
 * // → { start: Date("2025-01-01T00:00:00.000"), end: Date("2025-01-31T23:59:59.999") }
 *
 * resolveDateRange()
 * // → { start: Date("2025-01-01T00:00:00.000"), end: Date("2025-01-24T23:59:59.999") }
 */
function resolveDateRange(startDate, endDate) {
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);
    let start;
    if (startDate) {
        start = new Date(startDate);
    }
    else {
        // Default: tanggal 1 bulan berjalan berdasarkan end date
        start = new Date(end.getFullYear(), end.getMonth(), 1);
    }
    start.setHours(0, 0, 0, 0);
    return { start, end };
}
/**
 * PERIOD LABEL HELPERS
 * Format tanggal menjadi label string berdasarkan period.
 * Menggunakan UTC agar konsisten tanpa pengaruh timezone server.
 *
 * @example
 * formatPeriodLabel(new Date("2025-01-15"), "daily")   // "2025-01-15"
 * formatPeriodLabel(new Date("2025-01-15"), "monthly") // "2025-01"
 * formatPeriodLabel(new Date("2025-01-15"), "yearly")  // "2025"
 */
function formatPeriodLabel(date, period) {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    switch (period) {
        case "daily":
            return `${year}-${month}-${day}`;
        case "monthly":
            return `${year}-${month}`;
        case "yearly":
            return `${year}`;
    }
}
/**
 * Group daftar order ke dalam bucket berdasarkan period,
 * lalu hitung agregasi per bucket (totalOrders, paidOrders,
 * totalRevenue, avgOrderValue).
 *
 * @example
 * groupOrdersByPeriod(orders, "monthly")
 * // → [{ period: "2025-01", totalOrders: 10, paidOrders: 8, totalRevenue: 800000, avgOrderValue: 100000 }]
 */
function groupOrdersByPeriod(rows, period) {
    var _a, _b;
    // Map<label, stats> — insertion order terjaga di JS Map
    const buckets = new Map();
    for (const row of rows) {
        const label = formatPeriodLabel(row.createdAt, period);
        const existing = (_a = buckets.get(label)) !== null && _a !== void 0 ? _a : {
            totalOrders: 0,
            paidOrders: 0,
            totalRevenue: 0,
        };
        existing.totalOrders += 1;
        if (row.isPaid) {
            existing.paidOrders += 1;
            existing.totalRevenue += (_b = row.totalPrice) !== null && _b !== void 0 ? _b : 0;
        }
        buckets.set(label, existing);
    }
    // Sort ascending berdasarkan label — aman karena format ISO-like (YYYY-MM-DD, YYYY-MM, YYYY)
    const sorted = Array.from(buckets.entries()).sort(([a], [b]) => a.localeCompare(b));
    return sorted.map(([label, stats]) => ({
        period: label,
        totalOrders: stats.totalOrders,
        paidOrders: stats.paidOrders,
        totalRevenue: stats.totalRevenue,
        avgOrderValue: stats.paidOrders > 0
            ? Math.round(stats.totalRevenue / stats.paidOrders)
            : 0,
    }));
}
/**
 * OUTLET HELPERS
 * Tentukan outletId yang akan digunakan sebagai filter query
 * berdasarkan role dan parameter request.
 *
 * Rules:
 * - Outlet Admin → selalu pakai scopedOutletId dari token (tidak bisa di-override client)
 * - Super Admin  → pakai queryOutletId jika ada, null = semua outlet
 *
 * @example
 * resolveFilterOutletId(false, "outlet-abc", "outlet-xyz") // "outlet-abc" (outlet admin)
 * resolveFilterOutletId(true,  null,         "outlet-xyz") // "outlet-xyz" (super admin filter)
 * resolveFilterOutletId(true,  null,         undefined)    // null         (super admin all)
 */
function resolveFilterOutletId(isSuperAdmin, scopedOutletId, queryOutletId) {
    if (!isSuperAdmin)
        return scopedOutletId;
    return queryOutletId !== null && queryOutletId !== void 0 ? queryOutletId : null;
}
/**
 * Ambil info outlet (id & name) dari database.
 * Mengembalikan null jika outletId null (berarti semua outlet).
 * Melempar AppError 404 jika outletId ada tapi outlet tidak ditemukan.
 *
 * @example
 * fetchOutletInfo(null)        // → null
 * fetchOutletInfo("outlet-abc") // → { id: "outlet-abc", name: "Outlet Jakarta" }
 * fetchOutletInfo("not-exist")  // → throws AppError("Outlet not found", 404)
 */
function fetchOutletInfo(outletId) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!outletId)
            return null;
        const outlet = yield prisma_config_1.default.outlet.findUnique({
            where: { id: outletId, deletedAt: null },
            select: { id: true, name: true },
        });
        if (!outlet)
            throw (0, app_error_1.AppError)("Outlet not found", 404);
        return outlet;
    });
}
