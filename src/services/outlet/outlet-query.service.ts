import prisma from "../../config/prisma.config";
import { AppError } from "../../utils/app-error";
import { OutletResponse } from "../../@types/outlet.types";
import {
  formatOutletResponse,
  outletInclude,
  outletDetailInclude,
} from "./outlet.helpers";

export async function getAllOutlets(
  page: number,
  limit: number,
  search?: string,
  scopedOutletId: string | null = null,
  isSuperAdmin: boolean = false,
) {
  const skip = (page - 1) * limit;

  const where: any = { deletedAt: null };

  // Outlet admin hanya bisa lihat outletnya sendiri
  if (!isSuperAdmin && scopedOutletId) {
    where.id = scopedOutletId;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { address: { contains: search, mode: "insensitive" } },
      { city: { contains: search, mode: "insensitive" } },
      { province: { contains: search, mode: "insensitive" } },
      { outletCode: { contains: search, mode: "insensitive" } },
    ];
  }

  const [total, outlets] = await Promise.all([
    prisma.outlet.count({ where }),
    prisma.outlet.findMany({
      where,
      skip,
      take: limit,
      include: outletInclude,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const formattedOutlets: OutletResponse[] = outlets.map(formatOutletResponse);

  return {
    outlets: formattedOutlets,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getAllOutletsForDropdown(
  scopedOutletId: string | null = null,
  isSuperAdmin: boolean = false,
): Promise<{ id: string; name: string; outletCode: string }[]> {
  const where: any = {
    deletedAt: null,
    status: "AVAILABLE", // Hanya outlet aktif untuk dropdown
  };

  // Outlet Admin hanya bisa lihat outletnya sendiri
  if (!isSuperAdmin && scopedOutletId) {
    where.id = scopedOutletId;
  }

  return await prisma.outlet.findMany({
    where,
    select: { id: true, name: true, outletCode: true },
    orderBy: { name: "asc" },
    // Tidak ada take/skip — ambil SEMUA outlet untuk dropdown
  });
}

export async function getOutletById(
  outletId: string,
  scopedOutletId: string | null = null,
  isSuperAdmin: boolean = false,
): Promise<OutletResponse> {
  if (!isSuperAdmin && scopedOutletId && outletId !== scopedOutletId) {
    throw AppError("Forbidden: You can only view your own outlet details", 403);
  }

  const outlet = await prisma.outlet.findUnique({
    where: { id: outletId, deletedAt: null },
    include: outletDetailInclude,
  });

  if (!outlet) throw AppError("Outlet not found", 404);

  return formatOutletResponse(outlet);
}
