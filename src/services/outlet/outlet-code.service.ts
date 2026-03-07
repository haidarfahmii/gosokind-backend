import prisma from "../../config/prisma.config";
import { getCityCode } from "../../utils/city-code.util";

/**
 * Generate unique outlet code berdasarkan nama kota.
 * Format: OUT-{CITY_CODE}-{NNN}
 *
 * Menggunakan count inklusif (termasuk soft-deleted) agar
 * nomor urut tidak pernah duplikat meskipun outlet sudah dihapus.
 *
 * @example
 * generateOutletCode("Bandung") // → "OUT-BDG-001"
 * generateOutletCode("Jakarta") // → "OUT-JKT-003"
 */
export async function generateOutletCode(city: string): Promise<string> {
  const cityCode = getCityCode(city);
  const prefix = `OUT-${cityCode}-`;

  const existingCount = await prisma.outlet.count({
    where: {
      outletCode: { startsWith: prefix },
    },
  });

  const sequence = String(existingCount + 1).padStart(3, "0");
  return `${prefix}${sequence}`;
}
