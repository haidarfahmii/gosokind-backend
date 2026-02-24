import { Request, Response, NextFunction } from "express";
import { reportService } from "../services/report.service";
import {
  SalesReportQuery,
  EmployeePerformanceQuery,
  ReportPeriod,
} from "../@types/report.types";

export const reportController = {
  /**
   * GET /api/reports/sales
   *
   * Query params:
   *   - period    : "daily" | "monthly" | "yearly"  (wajib)
   *   - startDate : YYYY-MM-DD  (opsional, default: awal bulan ini)
   *   - endDate   : YYYY-MM-DD  (opsional, default: hari ini)
   *   - outletId  : string      (opsional, Super Admin only)
   *
   * Auth:
   *   - Super Admin  → bisa lihat semua outlet, atau filter via ?outletId
   *   - Outlet Admin → otomatis hanya lihat outlet sendiri
   */
  async getSalesReport(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // Pastikan period tersedia (sudah divalidasi oleh salesReportValidator)
      const query: SalesReportQuery = {
        period: req.query.period as ReportPeriod,
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
        outletId: req.query.outletId as string | undefined,
      };

      // Diisi oleh verifyOutletScope middleware
      const scopedOutletId: string | null = res.locals.scopedOutletId ?? null;
      const isSuperAdmin: boolean = res.locals.isSuperAdmin ?? false;

      const data = await reportService.getSalesReport(
        query,
        scopedOutletId,
        isSuperAdmin,
      );

      res.status(200).json({
        success: true,
        message: "Sales report retrieved successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/reports/employee-performance
   *
   * Query params:
   *   - startDate : YYYY-MM-DD  (opsional, default: awal bulan ini)
   *   - endDate   : YYYY-MM-DD  (opsional, default: hari ini)
   *   - outletId  : string      (opsional, Super Admin only)
   *   - role      : "WORKER_WASHING" | "WORKER_IRONING" | "WORKER_PACKING" | "DRIVER"  (opsional)
   *
   * Auth:
   *   - Super Admin  → bisa lihat semua outlet, atau filter via ?outletId
   *   - Outlet Admin → otomatis hanya lihat outlet sendiri
   */
  async getEmployeePerformanceReport(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const query: EmployeePerformanceQuery = {
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
        outletId: req.query.outletId as string | undefined,
        role: req.query.role as string | undefined,
      };

      // Diisi oleh verifyOutletScope middleware
      const scopedOutletId: string | null = res.locals.scopedOutletId ?? null;
      const isSuperAdmin: boolean = res.locals.isSuperAdmin ?? false;

      const data = await reportService.getEmployeePerformanceReport(
        query,
        scopedOutletId,
        isSuperAdmin,
      );

      res.status(200).json({
        success: true,
        message: "Employee performance report retrieved successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  },
};
