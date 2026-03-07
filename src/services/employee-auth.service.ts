import prisma from "../config/prisma.config";
import { AppError } from "../utils/app-error";
import { createToken } from "../utils/jwt.util";
import bcrypt from "bcrypt";
import { JWT_SECRET } from "../config/index.config";
import {
  EmployeeLoginInput,
  EmployeeAuthResponse,
} from "../@types/employee.types";

export const employeeAuthService = {
  // Login untuk Employee (Admin, Worker, Driver)
  async login(input: EmployeeLoginInput): Promise<EmployeeAuthResponse> {
    const { email, password } = input;

    // Cari employee
    const employee = await prisma.employee.findUnique({
      where: { email, deletedAt: null },
      include: {
        outlet: true,
      },
    });

    if (!employee) {
      throw AppError("Invalid email or password", 401);
    }

    // Validasi password
    const isPasswordValid = await bcrypt.compare(password, employee.password);

    if (!isPasswordValid) {
      throw AppError("Invalid email or password", 401);
    }

    // Generate token
    const token = await createToken(
      {
        userId: employee.id,
        email: employee.email,
        role: employee.role,
        outletId: employee.outletId,
      },
      JWT_SECRET!,
      {
        expiresIn: "24h",
      },
    );

    return {
      token,
      user: {
        id: employee.id,
        fullName: employee.fullName,
        email: employee.email,
        role: employee.role,
        avatarUrl: employee.avatarUrl,
        outletId: employee.outletId,
        outletName: employee.outlet?.name,
      },
    };
  },
};
