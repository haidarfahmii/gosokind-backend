import { Request, Response } from "express";
import { outletService } from "../services/outlet.service";

export const outletController = {
  async getAllOutlets(req: Request, res: Response) {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const scopedOutletId = res.locals.scopedOutletId;
    const isSuperAdmin = res.locals.isSuperAdmin;

    const result = await outletService.getAllOutlets(
      page,
      limit,
      search,
      scopedOutletId,
      isSuperAdmin,
    );

    res.status(200).json({
      success: true,
      message: "Outlets retrieved successfully",
      data: result.outlets,
      pagination: result.pagination,
    });
  },

  async getAllOutletsForDropdown(req: Request, res: Response) {
    const scopedOutletId = res.locals.scopedOutletId;
    const isSuperAdmin = res.locals.isSuperAdmin;

    const outlets = await outletService.getAllOutletsForDropdown(
      scopedOutletId,
      isSuperAdmin,
    );

    res.status(200).json({
      success: true,
      message: "Outlets for dropdown retrieved successfully",
      data: outlets,
    });
  },

  async getOutletById(req: Request, res: Response) {
    const { id } = req.params;

    const scopedOutletId = res.locals.scopedOutletId;
    const isSuperAdmin = res.locals.isSuperAdmin;

    const outlet = await outletService.getOutletById(
      id as string,
      scopedOutletId,
      isSuperAdmin,
    );

    res.status(200).json({
      success: true,
      message: "Outlet retrieved successfully",
      data: outlet,
    });
  },

  async createOutlet(req: Request, res: Response) {
    const { name, province, city, address, latitude, longitude, status } =
      req.body;

    const outlet = await outletService.createOutlet({
      name,
      province,
      city,
      address,
      latitude,
      longitude,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Outlet created successfully",
      data: outlet,
    });
  },

  async updateOutlet(req: Request, res: Response) {
    const { id } = req.params;
    const { name, province, city, address, latitude, longitude, status } =
      req.body;

    const outlet = await outletService.updateOutlet(id as string, {
      name,
      province,
      city,
      address,
      latitude,
      longitude,
      status,
    });

    res.status(200).json({
      success: true,
      message: "Outlet updated successfully",
      data: outlet,
    });
  },

  async deleteOutlet(req: Request, res: Response) {
    const { id } = req.params;

    const outlet = await outletService.deleteOutlet(id as string);

    res.status(200).json({
      success: true,
      message: "Outlet deleted successfully",
      data: outlet,
    });
  },

  async calculateShipping(req: Request, res: Response) {
    const { outletId } = req.params;
    const { latitude, longitude } = req.body;

    const scopedOutletId = res.locals.scopedOutletId;
    const isSuperAdmin = res.locals.isSuperAdmin;

    const result = await outletService.calculateShipping(
      outletId as string,
      latitude,
      longitude,
      scopedOutletId,
      isSuperAdmin,
    );

    res.status(200).json({
      success: true,
      message: "Shipping cost calculated successfully",
      data: result,
    });
  },
};