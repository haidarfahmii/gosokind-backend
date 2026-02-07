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

export const employeeService = {
  async createEmployee(input: CreateEmployeeInput): Promise<EmployeeResponse> {
    const { email, password, fullName, role, outletId } = input;

    // Cek apakah email sudah digunakan
    const existingEmployee = await prisma.employee.findUnique({
      where: { email },
    });

    if (existingEmployee) {
      throw AppError("Email already exists", 400);
    }

    // Validasi: Jika bukan Super Admin, outletId harus ada
    if (role !== EmployeeRole.SUPER_ADMIN && !outletId) {
      throw AppError("Outlet is required for non-Super Admin roles", 400);
    }

    // Validasi: Jika Super Admin, outletId harus null
    if (role === EmployeeRole.SUPER_ADMIN && outletId) {
      throw AppError("Super Admin cannot be assigned to an outlet", 400);
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

  async getAllEmployees(query: EmployeeListQuery) {
    const { page = 1, limit = 10, role, outletId, search, isActive } = query;
    const skip = (page - 1) * limit;

    // Build filter
    const where: any = {
      deletedAt: null,
    };

    if (role) {
      where.role = role;
    }

    if (outletId) {
      where.outletId = outletId;
    }

    if (isActive !== undefined) where.isActive = isActive;

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

  async getEmployeeById(employeeId: string): Promise<EmployeeResponse> {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId, deletedAt: null },
      include: {
        outlet: true,
      },
    });

    if (!employee) {
      throw AppError("Employee not found", 404);
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
  ): Promise<EmployeeResponse> {
    const { email, password, fullName, role, outletId, isActive } = input;

    // Cek apakah employee ada
    const existingEmployee = await prisma.employee.findUnique({
      where: { id: employeeId, deletedAt: null },
    });

    if (!existingEmployee) {
      throw AppError("Employee not found", 404);
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

    // Validasi role dan outlet
    const newRole = role || existingEmployee.role;
    const newOutletId =
      outletId !== undefined ? outletId : existingEmployee.outletId;

    if (newRole !== EmployeeRole.SUPER_ADMIN && !newOutletId) {
      throw AppError("Outlet is required for non-Super Admin roles", 400);
    }

    if (newRole === EmployeeRole.SUPER_ADMIN && newOutletId) {
      throw AppError("Super Admin cannot be assigned to an outlet", 400);
    }

    // Validasi outlet jika ada
    if (newOutletId && newOutletId !== existingEmployee.outletId) {
      const outlet = await prisma.outlet.findUnique({
        where: { id: newOutletId },
      });

      if (!outlet) {
        throw AppError("Outlet not found", 404);
      }
    }

    // Prepare update data
    const updateData: any = {};

    if (email) updateData.email = email;
    if (fullName) updateData.fullName = fullName;
    if (role) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Handle outlet assignment
    if (role === EmployeeRole.SUPER_ADMIN) {
      updateData.outletId = null;
    } else if (outletId !== undefined) {
      updateData.outletId = outletId;
    }

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Update employee
    const updatedEmployee = await prisma.employee.update({
      where: { id: employeeId },
      data: updateData,
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
  ): Promise<EmployeeResponse> {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId, deletedAt: null },
    });

    if (!employee) {
      throw AppError("Employee not found", 404);
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
};
