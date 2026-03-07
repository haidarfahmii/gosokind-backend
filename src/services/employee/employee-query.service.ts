import prisma from "../../config/prisma.config";
import { AppError } from "../../utils/app-error";
import {
  EmployeeResponse,
  EmployeeListQuery,
} from "../../@types/employee.types";
import { formatEmployeeResponse } from "./employee.helpers";

export async function getAllEmployees(
  query: EmployeeListQuery,
  scopedOutletId: string | null = null,
  isSuperAdmin: boolean = false,
) {
  const { page = 1, limit = 10, role, outletId, search, isActive } = query;
  const skip = (page - 1) * limit;

  const where: any = { deletedAt: null };

  // Outlet scope enforcement
  if (!isSuperAdmin && scopedOutletId) {
    where.outletId = scopedOutletId;
  } else if (isSuperAdmin && outletId) {
    where.outletId = outletId;
  }

  if (role) where.role = role;
  if (outletId) where.outletId = outletId;
  if (isActive !== undefined) where.isActive = isActive;

  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const [total, employees] = await Promise.all([
    prisma.employee.count({ where }),
    prisma.employee.findMany({
      where,
      skip,
      take: limit,
      include: { outlet: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const data: EmployeeResponse[] = employees.map(formatEmployeeResponse);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getEmployeeById(
  employeeId: string,
  scopedOutletId: string | null = null,
  isSuperAdmin: boolean = false,
): Promise<EmployeeResponse> {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId, deletedAt: null },
    include: { outlet: true },
  });

  if (!employee) {
    throw AppError(
      "Employee not found or you don't have access to this employee",
      404,
    );
  }

  if (!isSuperAdmin && scopedOutletId && employee.outletId !== scopedOutletId) {
    throw AppError("Forbidden: You don't have access to this employee", 403);
  }

  return formatEmployeeResponse(employee);
}

export async function getEmployeeStats(
  scopedOutletId: string | null = null,
  isSuperAdmin: boolean = false,
) {
  const where: any = { deletedAt: null };

  if (!isSuperAdmin && scopedOutletId) {
    where.outletId = scopedOutletId;
  }

  const [total, active, inactive, byRoleRaw] = await Promise.all([
    prisma.employee.count({ where }),
    prisma.employee.count({ where: { ...where, isActive: true } }),
    prisma.employee.count({ where: { ...where, isActive: false } }),
    prisma.employee.groupBy({
      by: ["role"],
      where,
      _count: { role: true },
    }),
  ]);

  const byRole = byRoleRaw.reduce(
    (acc, item) => {
      acc[item.role] = item._count.role;
      return acc;
    },
    {} as Record<string, number>,
  );

  return { total, active, inactive, byRole };
}
