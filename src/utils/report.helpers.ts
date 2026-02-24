import prisma from "../config/prisma.config";
import { AppError } from "./app-error";
import { ReportPeriod, SalesReportItem } from "../@types/report.types";

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
export function resolveDateRange(
  startDate?: string,
  endDate?: string,
): { start: Date; end: Date } {
  const end = endDate ? new Date(endDate) : new Date();
  end.setHours(23, 59, 59, 999);

  let start: Date;
  if (startDate) {
    start = new Date(startDate);
  } else {
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
export function formatPeriodLabel(date: Date, period: ReportPeriod): string {
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
 * SALES GROUPING HELPERS
 * Tipe untuk raw order row hasil Prisma select.
 * Dieksport agar bisa digunakan sebagai type hint di service.
 */
export interface RawOrderRow {
  createdAt: Date;
  totalPrice: number | null;
  isPaid: boolean;
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
export function groupOrdersByPeriod(
  rows: RawOrderRow[],
  period: ReportPeriod,
): SalesReportItem[] {
  // Map<label, stats> — insertion order terjaga di JS Map
  const buckets = new Map<
    string,
    { totalOrders: number; paidOrders: number; totalRevenue: number }
  >();

  for (const row of rows) {
    const label = formatPeriodLabel(row.createdAt, period);
    const existing = buckets.get(label) ?? {
      totalOrders: 0,
      paidOrders: 0,
      totalRevenue: 0,
    };

    existing.totalOrders += 1;

    if (row.isPaid) {
      existing.paidOrders += 1;
      existing.totalRevenue += row.totalPrice ?? 0;
    }

    buckets.set(label, existing);
  }

  // Sort ascending berdasarkan label — aman karena format ISO-like (YYYY-MM-DD, YYYY-MM, YYYY)
  const sorted = Array.from(buckets.entries()).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  return sorted.map(([label, stats]) => ({
    period: label,
    totalOrders: stats.totalOrders,
    paidOrders: stats.paidOrders,
    totalRevenue: stats.totalRevenue,
    avgOrderValue:
      stats.paidOrders > 0
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
export function resolveFilterOutletId(
  isSuperAdmin: boolean,
  scopedOutletId: string | null,
  queryOutletId?: string,
): string | null {
  if (!isSuperAdmin) return scopedOutletId;
  return queryOutletId ?? null;
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
export async function fetchOutletInfo(
  outletId: string | null,
): Promise<{ id: string; name: string } | null> {
  if (!outletId) return null;

  const outlet = await prisma.outlet.findUnique({
    where: { id: outletId, deletedAt: null },
    select: { id: true, name: true },
  });

  if (!outlet) throw AppError("Outlet not found", 404);
  return outlet;
}
