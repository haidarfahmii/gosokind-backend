import prisma from "../config/prisma.config";
import { AppError } from "../utils/app-error";
import bcrypt from "bcrypt";
import {
  CreateEmployeeInput,
  UpdateEmployeeInput,
  EmployeeResponse,
  EmployeeListQuery,
} from "../@types/employee.types";
import { EmployeeRole } from "@prisma/client";
import { getDriverHistory } from "./driver.service";
import { getWorkerHistory } from "./worker.service";

export const employeeService = {
  async createEmployee(
    input: CreateEmployeeInput,
    scopedOutletId: string | null = null,
    isSuperAdmin: boolean = false,
  ): Promise<EmployeeResponse> {
    let { email, password, fullName, role, outletId } = input;

    if (!isSuperAdmin && scopedOutletId) {
      // Jika outlet admin tidak mengirim outletId, gunakan scopedOutletId mereka
      if (!outletId) {
        outletId = scopedOutletId;
      }

      // Jika outlet admin mengirim outletId, pastikan sama dengan scopedOutletId
      if (outletId !== scopedOutletId) {
        throw AppError(
          "Forbidden: You can only create employees for your own outlet",
          403,
        );
      }

      // outlet admin tidak bisa membuat super admin atau outlet admin lain
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

    // Cek apakah email sudah digunakan
    const existingEmployee = await prisma.employee.findUnique({
      where: { email },
    });

    if (existingEmployee) {
      throw AppError("Email already exists", 400);
    }

    // Validasi jika bukan Super Admin, outletId harus ada
    if (role !== EmployeeRole.SUPER_ADMIN && !outletId) {
      throw AppError("Outlet is required for non-Super Admin roles", 400);
    }

    // Validasi jJika Super Admin, outletId harus null
    if (role === EmployeeRole.SUPER_ADMIN && outletId) {
      throw AppError("Super Admin cannot be assigned to an outlet", 400);
    }

    // Hanya super admin yang bisa membuat super admin atau outlet admin
    if (
      !isSuperAdmin &&
      (role === EmployeeRole.SUPER_ADMIN || role === EmployeeRole.OUTLET_ADMIN)
    ) {
      throw AppError(
        "Forbidden: Only Super Admin can create Super Admin or Outlet Admin accounts",
        403,
      );
    }

    // Validasi outlet jika ada
    if (outletId) {
      const outlet = await prisma.outlet.findUnique({
        where: { id: outletId },
      });

      if (!outlet) {
        throw AppError("Outlet not found", 404);
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Buat employee
    const employee = await prisma.employee.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
        role,
        outletId: role === EmployeeRole.SUPER_ADMIN ? null : outletId,
        isActive: input.isActive ?? true,
      },
      include: {
        outlet: true,
      },
    });

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
  },

  async getAllEmployees(
    query: EmployeeListQuery,
    scopedOutletId: string | null = null,
    isSuperAdmin: boolean = false,
  ) {
    const { page = 1, limit = 10, role, outletId, search, isActive } = query;
    const skip = (page - 1) * limit;

    // Build filter
    const where: any = {
      deletedAt: null,
    };

    // outlet scope
    if (!isSuperAdmin && scopedOutletId) {
      // jika outlet admin, batasi ke outletnya
      where.outletId = scopedOutletId;
    } else if (isSuperAdmin && outletId) {
      where.outletId = outletId;
    }

    if (role) {
      where.role = role;
    }

    if (outletId) {
      where.outletId = outletId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get total count
    const total = await prisma.employee.count({ where });

    // Get employees
    const employees = await prisma.employee.findMany({
      where,
      skip,
      take: limit,
      include: {
        outlet: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedEmployees: EmployeeResponse[] = employees.map((emp) => ({
      id: emp.id,
      email: emp.email,
      fullName: emp.fullName,
      avatarUrl: emp.avatarUrl,
      role: emp.role,
      outletId: emp.outletId,
      outletName: emp.outlet?.name,
      isActive: emp.isActive,
      createdAt: emp.createdAt,
      updatedAt: emp.updatedAt,
    }));

    return {
      data: formattedEmployees,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getEmployeeStats(
    scopedOutletId: string | null = null,
    isSuperAdmin: boolean = false,
  ) {
    // Build where clause dengan outlet scope
    const where: any = { deletedAt: null };

    if (!isSuperAdmin && scopedOutletId) {
      where.outletId = scopedOutletId;
    }

    // Hitung total, active, inactive secara paralel
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

    // Format byRole menjadi { ROLE_NAME: count }
    const byRole = byRoleRaw.reduce(
      (acc, item) => {
        acc[item.role] = item._count.role;
        return acc;
      },
      {} as Record<string, number>,
    );

    return { total, active, inactive, byRole };
  },

  async getEmployeeById(
    employeeId: string,
    scopedOutletId: string | null = null,
    isSuperAdmin: boolean = false,
  ): Promise<EmployeeResponse> {
    const where: any = {
      id: employeeId,
      deletedAt: null,
    };

    // outlet scope
    if (!isSuperAdmin && scopedOutletId) {
      // outlet admin hanya bisa akses employee di outletnya
      where.outletId = scopedOutletId;
    }

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId, deletedAt: null },
      include: {
        outlet: true,
      },
    });

    if (!employee) {
      throw AppError(
        "Employee not found or you don't have access to this employee",
        404,
      );
    }

    // Double check outlet scope untuk non-super admin
    if (
      !isSuperAdmin &&
      scopedOutletId &&
      employee.outletId !== scopedOutletId
    ) {
      throw AppError("Forbidden: You don't have access to this employee", 403);
    }

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
  },

  async updateEmployee(
    employeeId: string,
    input: UpdateEmployeeInput,
    scopedOutletId: string | null = null,
    isSuperAdmin: boolean = false,
  ): Promise<EmployeeResponse> {
    let { email, password, fullName, role, outletId, isActive } = input;

    // Cek apakah employee ada
    const existingEmployee = await prisma.employee.findUnique({
      where: { id: employeeId, deletedAt: null },
    });

    if (!existingEmployee) {
      throw AppError("Employee not found", 404);
    }

    // outlet admin hanya bisa update employee di outletnya sendiri
    if (!isSuperAdmin && scopedOutletId) {
      // Cek apakah employee yang akan di-update ada di outlet yang sama
      if (existingEmployee.outletId !== scopedOutletId) {
        throw AppError(
          "Forbidden: You can only update employees in your own outlet",
          403,
        );
      }

      // Jika mencoba mengubah outletId
      if (outletId !== undefined) {
        // Jika outletId null atau berbeda, tolak
        if (!outletId || outletId !== scopedOutletId) {
          throw AppError(
            "Forbidden: You cannot move employees to other outlets",
            403,
          );
        }
      }

      // outlet admin tidak bisa mengubah role menjadi super admin atau outlet admin
      if (
        role &&
        (role === EmployeeRole.SUPER_ADMIN ||
          role === EmployeeRole.OUTLET_ADMIN)
      ) {
        throw AppError(
          "Forbidden: You cannot change employee role to Super Admin or Outlet Admin",
          403,
        );
      }
    }

    // Jika email diubah, cek duplikasi
    if (email && email !== existingEmployee.email) {
      const emailExists = await prisma.employee.findUnique({
        where: { email },
      });

      if (emailExists) {
        throw AppError("Email already exists", 400);
      }
    }

    // validasi outlet jika di ubah
    if (outletId !== undefined) {
      // jika role di ubah menjadi Super Admin, outletId harus null
      const newRole = role || existingEmployee.role;

      if (newRole === EmployeeRole.SUPER_ADMIN && outletId !== null) {
        throw AppError("Super Admin cannot be assigned to an outlet", 400);
      }

      // jika bukan Super Admin, outletId harus ada
      if (newRole !== EmployeeRole.SUPER_ADMIN && outletId) {
        const outlet = await prisma.outlet.findUnique({
          where: { id: outletId },
        });

        if (!outlet) {
          throw AppError("Outlet not found", 404);
        }
      }
    }

    let hashedPassword: string | undefined;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Update employee
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
      include: {
        outlet: true,
      },
    });

    return {
      id: updatedEmployee.id,
      email: updatedEmployee.email,
      fullName: updatedEmployee.fullName,
      avatarUrl: updatedEmployee.avatarUrl,
      role: updatedEmployee.role,
      outletId: updatedEmployee.outletId,
      outletName: updatedEmployee.outlet?.name,
      isActive: updatedEmployee.isActive,
      createdAt: updatedEmployee.createdAt,
      updatedAt: updatedEmployee.updatedAt,
    };
  },

  async deleteEmployee(employeeId: string): Promise<void> {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId, deletedAt: null },
    });

    if (!employee) {
      throw AppError("Employee not found", 404);
    }

    // Cek apakah ada order yang masih aktif
    const activeOrders = await prisma.order.count({
      where: {
        OR: [{ pickupDriverId: employeeId }, { deliveryDriverId: employeeId }],
        status: {
          notIn: ["COMPLETED"],
        },
      },
    });

    if (activeOrders > 0) {
      throw AppError(
        "Cannot delete employee with active orders. Please reassign or complete orders first.",
        400,
      );
    }

    // Soft delete
    await prisma.employee.update({
      where: { id: employeeId },
      data: {
        deletedAt: new Date(),
      },
    });
  },

  async getAllCustomers(query: EmployeeListQuery) {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const total = await prisma.customer.count({ where });

    const customers = await prisma.customer.findMany({
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
          where: { isPrimary: true }, // Hanya ambil primary address
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
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      data: customers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async toggleEmployeeStatus(
    employeeId: string,
    isActive: boolean,
    scopedOutletId: string | null = null,
    isSuperAdmin: boolean = false,
  ): Promise<EmployeeResponse> {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId, deletedAt: null },
      include: {
        outlet: true,
      },
    });

    if (!employee) {
      throw AppError("Employee not found", 404);
    }

    // validasi outlet admin hanya bisa toggle employee di outletnya
    if (!isSuperAdmin && scopedOutletId) {
      if (employee.outletId !== scopedOutletId) {
        throw AppError(
          "Forbidden: You can only change status of employees in your own outlet",
          403,
        );
      }
    }

    const updatedEmployee = await prisma.employee.update({
      where: { id: employeeId },
      data: { isActive },
      include: {
        outlet: true,
      },
    });

    return {
      id: updatedEmployee.id,
      email: updatedEmployee.email,
      fullName: updatedEmployee.fullName,
      avatarUrl: updatedEmployee.avatarUrl,
      role: updatedEmployee.role,
      outletId: updatedEmployee.outletId,
      outletName: updatedEmployee.outlet?.name,
      isActive: updatedEmployee.isActive,
      createdAt: updatedEmployee.createdAt,
      updatedAt: updatedEmployee.updatedAt,
    };
  },
  async getEmployeeHistory(
    employeeId: string,
    page: number,
    limit: number,
    scopedOutletId: string | null = null,
    isSuperAdmin: boolean = false
  ) {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId, deletedAt: null },
      select: {
        id: true,
        role: true,
        outletId: true
      }
    });

    if (!employee) {
      throw AppError("Employee not found", 404);
    }

    // Role validation
    const allowedRoles: EmployeeRole[] = [
      EmployeeRole.DRIVER, 
      EmployeeRole.WORKER_WASHING, 
      EmployeeRole.WORKER_IRONING, 
      EmployeeRole.WORKER_PACKING
    ];
    if (!allowedRoles.includes(employee.role)) {
      throw AppError("History is only available for Drivers and Workers", 400);
    }

    // Outlet validation
    if (!isSuperAdmin && scopedOutletId && employee.outletId !== scopedOutletId) {
       throw AppError("Forbidden: You can only view history of employees in your own outlet", 403);
    }

    // Fetch matching history based on role
    if (employee.role === EmployeeRole.DRIVER) {
       return await getDriverHistory(employee.id, page, limit);
    } else {
       return await getWorkerHistory(employee.id as string, page, limit); 
    }
  },
};
