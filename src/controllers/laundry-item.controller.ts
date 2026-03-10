import { Request, Response } from "express";
import { laundryItemService } from "../services/laundry-item.service";
import {
  CreateLaundryItemInput,
  UpdateLaundryItemInput,
} from "../@types/laundry-item.types";

export const laundryItemController = {
  async createLaundryItem(req: Request, res: Response) {
    const input: CreateLaundryItemInput = req.body;

    const item = await laundryItemService.createLaundryItem(input);

    res.status(201).json({
      success: true,
      message: "Laundry item created successfully",
      data: item,
    });
  },

  async getAllLaundryItems(req: Request, res: Response) {
    const { page, limit, search, category, pricingType, sortBy, sortOrder } =
      req.query;

    const query = {
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      search: search as string,
      category: category as string,
      pricingType: pricingType as "WEIGHT" | "ITEM" | undefined,
      sortBy: sortBy as
        | "name"
        | "category"
        | "basePrice"
        | "createdAt"
        | undefined,
      sortOrder: sortOrder as "asc" | "desc" | undefined,
    };

    const result = await laundryItemService.getAllLaundryItems(query);

    res.status(200).json({
      success: true,
      message: "Laundry items retrieved successfully",
      ...result,
    });
  },

  async getLaundryItemById(req: Request, res: Response) {
    const { id } = req.params;

    const item = await laundryItemService.getLaundryItemById(id as string);

    res.status(200).json({
      success: true,
      message: "Laundry item retrieved successfully",
      data: item,
    });
  },

  async updateLaundryItem(req: Request, res: Response) {
    const { id } = req.params;
    const input: UpdateLaundryItemInput = req.body;

    const item = await laundryItemService.updateLaundryItem(
      id as string,
      input,
    );

    res.status(200).json({
      success: true,
      message: "Laundry item updated successfully",
      data: item,
    });
  },

  async deleteLaundryItem(req: Request, res: Response) {
    const { id } = req.params;

    await laundryItemService.deleteLaundryItem(id as string);

    res.status(200).json({
      success: true,
      message: "Laundry item deleted successfully",
    });
  },

  async getCategories(req: Request, res: Response) {
    const categories = await laundryItemService.getCategories();

    res.status(200).json({
      success: true,
      message: "Categories retrieved successfully",
      data: categories,
    });
  },

  async getPopularItems(req: Request, res: Response) {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    const items = await laundryItemService.getPopularItems(limit);

    res.status(200).json({
      success: true,
      message: "Popular items retrieved successfully",
      data: items,
    });
  },
};
