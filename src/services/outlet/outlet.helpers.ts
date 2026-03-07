import { Outlet, Employee } from "@prisma/client";
import { OutletResponse } from "../../@types/outlet.types";

type OutletWithRelations = Outlet & {
  employees: Partial<Employee>[];
  _count: {
    employees: number;
    orders: number;
  };
};

/**
 * Format raw Prisma outlet + relasi menjadi OutletResponse DTO.
 * Digunakan secara konsisten di semua outlet service agar tidak ada
 * duplikasi field mapping.
 */
export function formatOutletResponse(
  outlet: OutletWithRelations,
): OutletResponse {
  return {
    id: outlet.id,
    outletCode: outlet.outletCode,
    name: outlet.name,
    address: outlet.address,
    province: outlet.province,
    city: outlet.city,
    latitude: outlet.latitude,
    longitude: outlet.longitude,
    status: outlet.status,
    employeeCount: outlet._count.employees,
    orderCount: outlet._count.orders,
    employees: outlet.employees,
    createdAt: outlet.createdAt,
    updatedAt: outlet.updatedAt,
  };
}

/**
 * Prisma include clause yang dipakai secara konsisten
 * saat query outlet membutuhkan relasi employees & _count.
 */
export const outletInclude = {
  employees: {
    where: { deletedAt: null },
    select: {
      id: true,
      fullName: true,
      role: true,
      isActive: true,
    },
  },
  _count: {
    select: {
      employees: { where: { deletedAt: null } },
      orders: true,
    },
  },
} as const;

/**
 * Prisma include clause dengan field email & avatarUrl ekstra
 * — dipakai di getOutletById untuk tampilan detail.
 */
export const outletDetailInclude = {
  employees: {
    where: { deletedAt: null },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      isActive: true,
      avatarUrl: true,
    },
  },
  _count: {
    select: {
      employees: { where: { deletedAt: null } },
      orders: true,
    },
  },
} as const;
