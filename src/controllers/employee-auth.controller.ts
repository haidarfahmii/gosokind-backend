import { Request, Response, NextFunction } from "express";
import { employeeAuthService } from "../services/employee-auth.service";
import { EmployeeLoginInput } from "../@types/employee.types";

export const employeeAuthController = {
  async login(req: Request, res: Response, _next: NextFunction) {
    const input: EmployeeLoginInput = req.body;

    const result = await employeeAuthService.login(input);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  },
};
