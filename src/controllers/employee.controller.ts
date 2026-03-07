import { Request, Response } from "express";
import { employeeService } from "../services/employee";
import {
  CreateEmployeeInput,
  UpdateEmployeeInput,
  ToggleStatusInput,
} from "../@types/employee.types";

export const employeeController = {
  async createEmployee(req: Request, res: Response) {
    const input: CreateEmployeeInput = req.body;

    const scopedOutletId = res.locals.scopedOutletId;
    const isSuperAdmin = res.locals.isSuperAdmin;

    const employee = await employeeService.createEmployee(
      input,
      scopedOutletId,
      isSuperAdmin,
    );

    res.status(201).json({
      success: true,
      message: "Employee created successfully",
      data: employee,
    });
  },

  async getAllEmployees(req: Request, res: Response) {
    const { page, limit, role, outletId, search, isActive } = req.query;

    const scopedOutletId = res.locals.scopedOutletId;
    const isSuperAdmin = res.locals.isSuperAdmin;

    const query = {
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      role: role as any,
      outletId: outletId as string,
      search: search as string,
      isActive:
        isActive === "true" ? true : isActive === "false" ? false : undefined,
    };

    const result = await employeeService.getAllEmployees(
      query,
      scopedOutletId,
      isSuperAdmin,
    );

    res.status(200).json({
      success: true,
      message: "Employees retrieved successfully",
      ...result,
    });
  },

  async getEmployeeStats(req: Request, res: Response) {
    const scopedOutletId = res.locals.scopedOutletId;
    const isSuperAdmin = res.locals.isSuperAdmin;

    const result = await employeeService.getEmployeeStats(
      scopedOutletId,
      isSuperAdmin,
    );

    res.status(200).json({
      success: true,
      message: "Employee stats retrieved successfully",
      data: result,
    });
  },

  async getEmployeeById(req: Request, res: Response) {
    const { id } = req.params;

    const scopedOutletId = res.locals.scopedOutletId;
    const isSuperAdmin = res.locals.isSuperAdmin;

    const employee = await employeeService.getEmployeeById(
      id as string,
      scopedOutletId,
      isSuperAdmin,
    );

    res.status(200).json({
      success: true,
      message: "Employee retrieved successfully",
      data: employee,
    });
  },

  async updateEmployee(req: Request, res: Response) {
    const { id } = req.params;
    const input: UpdateEmployeeInput = req.body;

    const scopedOutletId = res.locals.scopedOutletId;
    const isSuperAdmin = res.locals.isSuperAdmin;

    const employee = await employeeService.updateEmployee(
      id as string,
      input,
      scopedOutletId,
      isSuperAdmin,
    );

    res.status(200).json({
      success: true,
      message: "Employee updated successfully",
      data: employee,
    });
  },

  async deleteEmployee(req: Request, res: Response) {
    const { id } = req.params;

    await employeeService.deleteEmployee(id as string);

    res.status(200).json({
      success: true,
      message: "Employee deleted successfully",
    });
  },

  async getAllCustomers(req: Request, res: Response) {
    const { page, limit, search } = req.query;

    const query = {
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      search: search as string,
    };

    const result = await employeeService.getAllCustomers(query);

    res.status(200).json({
      success: true,
      message: "Customers retrieved successfully",
      ...result,
    });
  },

  async toggleEmployeeStatus(req: Request, res: Response) {
    const { id } = req.params;
    const { isActive }: ToggleStatusInput = req.body;

    const scopedOutletId = res.locals.scopedOutletId;
    const isSuperAdmin = res.locals.isSuperAdmin;

    const employee = await employeeService.toggleEmployeeStatus(
      id as string,
      isActive,
      scopedOutletId,
      isSuperAdmin,
    );

    res.status(200).json({
      success: true,
      message: `Employee ${isActive ? "activated" : "deactivated"} successfully`,
      data: employee,
    });
  },
  async getEmployeeHistory(req: Request, res: Response) {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const scopedOutletId = res.locals.scopedOutletId;
    const isSuperAdmin = res.locals.isSuperAdmin;

    const result = await employeeService.getEmployeeHistory(
      id as string,
      page,
      limit,
      scopedOutletId,
      isSuperAdmin,
    );

    res.status(200).json({
      success: true,
      message: "Employee history retrieved successfully",
      ...result,
    });
  },
};
