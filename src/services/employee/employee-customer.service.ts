import prisma from "../../config/prisma.config";
import { AppError } from "../../utils/app-error";
import { CustomerListQuery } from "../../@types/employee.types";
import { EmployeeRole } from "@prisma/client";
import { getDriverHistory } from "../driver.service";
import { getWorkerHistory } from "../worker.service";

export async function getAllCustomers(query: CustomerListQuery) {
  const { page = 1, limit = 10, search } = query;
  const skip = (page - 1) * limit;

  const where: any = { deletedAt: null };

  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const [total, customers] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        isVerified: true,
        provider: true,
        createdAt: true,
        updatedAt: true,
        addresses: {
          where: { isPrimary: true },
          select: {
            id: true,
            label: true,
            address: true,
            latitude: true,
            longitude: true,
            isPrimary: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    data: customers,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getEmployeeHistory(
  employeeId: string,
  page: number,
  limit: number,
  scopedOutletId: string | null = null,
  isSuperAdmin: boolean = false,
) {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId, deletedAt: null },
    select: { id: true, role: true, outletId: true },
  });

  if (!employee) throw AppError("Employee not found", 404);

  const allowedRoles: EmployeeRole[] = [
    EmployeeRole.DRIVER,
    EmployeeRole.WORKER_WASHING,
    EmployeeRole.WORKER_IRONING,
    EmployeeRole.WORKER_PACKING,
  ];

  if (!allowedRoles.includes(employee.role)) {
    throw AppError("History is only available for Drivers and Workers", 400);
  }

  if (!isSuperAdmin && scopedOutletId && employee.outletId !== scopedOutletId) {
    throw AppError(
      "Forbidden: You can only view history of employees in your own outlet",
      403,
    );
  }

  if (employee.role === EmployeeRole.DRIVER) {
    return await getDriverHistory(employee.id, page, limit);
  }

  return await getWorkerHistory(employee.id, page, limit);
}
