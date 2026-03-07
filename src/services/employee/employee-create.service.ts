import prisma from "../../config/prisma.config";
import { AppError } from "../../utils/app-error";
import bcrypt from "bcrypt";
import {
  CreateEmployeeInput,
  EmployeeResponse,
} from "../../@types/employee.types";
import { EmployeeRole } from "@prisma/client";
import { formatEmployeeResponse } from "./employee.helpers";

export async function createEmployee(
  input: CreateEmployeeInput,
  scopedOutletId: string | null = null,
  isSuperAdmin: boolean = false,
): Promise<EmployeeResponse> {
  let { email, password, fullName, role, outletId } = input;

  // Outlet admin: enforce outlet scope & role restriction
  if (!isSuperAdmin && scopedOutletId) {
    if (!outletId) {
      outletId = scopedOutletId;
    }

    if (outletId !== scopedOutletId) {
      throw AppError(
        "Forbidden: You can only create employees for your own outlet",
        403,
      );
    }

    if (
      role === EmployeeRole.SUPER_ADMIN ||
      role === EmployeeRole.OUTLET_ADMIN
    ) {
      throw AppError(
        "Forbidden: You cannot create Super Admin or Outlet Admin accounts",
        403,
      );
    }
  }

  // Global role guards
  if (
    !isSuperAdmin &&
    (role === EmployeeRole.SUPER_ADMIN || role === EmployeeRole.OUTLET_ADMIN)
  ) {
    throw AppError(
      "Forbidden: Only Super Admin can create Super Admin or Outlet Admin accounts",
      403,
    );
  }

  const existingEmployee = await prisma.employee.findUnique({
    where: { email },
  });
  if (existingEmployee) throw AppError("Email already exists", 400);

  if (role !== EmployeeRole.SUPER_ADMIN && !outletId) {
    throw AppError("Outlet is required for non-Super Admin roles", 400);
  }

  if (role === EmployeeRole.SUPER_ADMIN && outletId) {
    throw AppError("Super Admin cannot be assigned to an outlet", 400);
  }

  if (outletId) {
    const outlet = await prisma.outlet.findUnique({ where: { id: outletId } });
    if (!outlet) throw AppError("Outlet not found", 404);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const employee = await prisma.employee.create({
    data: {
      email,
      password: hashedPassword,
      fullName,
      role,
      outletId: role === EmployeeRole.SUPER_ADMIN ? null : outletId,
      isActive: input.isActive ?? true,
    },
    include: { outlet: true },
  });

  return formatEmployeeResponse(employee);
}
