import prisma from "../../config/prisma.config";
import { AppError } from "../../utils/app-error";
import bcrypt from "bcrypt";
import {
  UpdateEmployeeInput,
  EmployeeResponse,
} from "../../@types/employee.types";
import { EmployeeRole } from "@prisma/client";
import { formatEmployeeResponse } from "./employee.helpers";

export async function updateEmployee(
  employeeId: string,
  input: UpdateEmployeeInput,
  scopedOutletId: string | null = null,
  isSuperAdmin: boolean = false,
): Promise<EmployeeResponse> {
  let { email, password, fullName, role, outletId, isActive } = input;

  const existingEmployee = await prisma.employee.findUnique({
    where: { id: employeeId, deletedAt: null },
  });
  if (!existingEmployee) throw AppError("Employee not found", 404);

  // Outlet admin restrictions
  if (!isSuperAdmin && scopedOutletId) {
    if (existingEmployee.outletId !== scopedOutletId) {
      throw AppError(
        "Forbidden: You can only update employees in your own outlet",
        403,
      );
    }

    if (outletId !== undefined && (!outletId || outletId !== scopedOutletId)) {
      throw AppError(
        "Forbidden: You cannot move employees to other outlets",
        403,
      );
    }

    if (
      role &&
      (role === EmployeeRole.SUPER_ADMIN || role === EmployeeRole.OUTLET_ADMIN)
    ) {
      throw AppError(
        "Forbidden: You cannot change employee role to Super Admin or Outlet Admin",
        403,
      );
    }
  }

  // Email uniqueness check
  if (email && email !== existingEmployee.email) {
    const emailExists = await prisma.employee.findUnique({ where: { email } });
    if (emailExists) throw AppError("Email already exists", 400);
  }

  // Outlet validation on role/outletId change
  if (outletId !== undefined) {
    const newRole = role || existingEmployee.role;

    if (newRole === EmployeeRole.SUPER_ADMIN && outletId !== null) {
      throw AppError("Super Admin cannot be assigned to an outlet", 400);
    }

    if (newRole !== EmployeeRole.SUPER_ADMIN && outletId) {
      const outlet = await prisma.outlet.findUnique({
        where: { id: outletId },
      });
      if (!outlet) throw AppError("Outlet not found", 404);
    }
  }

  const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

  const updatedEmployee = await prisma.employee.update({
    where: { id: employeeId },
    data: {
      email,
      password: hashedPassword,
      fullName,
      role,
      outletId,
      isActive,
    },
    include: { outlet: true },
  });

  return formatEmployeeResponse(updatedEmployee);
}

export async function deleteEmployee(employeeId: string): Promise<void> {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId, deletedAt: null },
  });
  if (!employee) throw AppError("Employee not found", 404);

  const activeOrders = await prisma.order.count({
    where: {
      OR: [{ pickupDriverId: employeeId }, { deliveryDriverId: employeeId }],
      status: { notIn: ["COMPLETED"] },
    },
  });

  if (activeOrders > 0) {
    throw AppError(
      "Cannot delete employee with active orders. Please reassign or complete orders first.",
      400,
    );
  }

  await prisma.employee.update({
    where: { id: employeeId },
    data: { deletedAt: new Date() },
  });
}

export async function toggleEmployeeStatus(
  employeeId: string,
  isActive: boolean,
  scopedOutletId: string | null = null,
  isSuperAdmin: boolean = false,
): Promise<EmployeeResponse> {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId, deletedAt: null },
    include: { outlet: true },
  });
  if (!employee) throw AppError("Employee not found", 404);

  if (!isSuperAdmin && scopedOutletId && employee.outletId !== scopedOutletId) {
    throw AppError(
      "Forbidden: You can only change status of employees in your own outlet",
      403,
    );
  }

  const updatedEmployee = await prisma.employee.update({
    where: { id: employeeId },
    data: { isActive },
    include: { outlet: true },
  });

  return formatEmployeeResponse(updatedEmployee);
}
