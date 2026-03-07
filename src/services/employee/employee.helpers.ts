import { Employee, Outlet } from "@prisma/client";
import { EmployeeResponse } from "../../@types/employee.types";

type EmployeeWithOutlet = Employee & { outlet: Outlet | null };

/**
 * Format raw Prisma employee + outlet menjadi EmployeeResponse DTO.
 * Digunakan secara konsisten di semua service agar tidak ada duplikasi mapping.
 */
export function formatEmployeeResponse(
  employee: EmployeeWithOutlet,
): EmployeeResponse {
  return {
    id: employee.id,
    email: employee.email,
    fullName: employee.fullName,
    avatarUrl: employee.avatarUrl,
    role: employee.role,
    outletId: employee.outletId,
    outletName: employee.outlet?.name,
    isActive: employee.isActive,
    createdAt: employee.createdAt,
    updatedAt: employee.updatedAt,
  };
}
