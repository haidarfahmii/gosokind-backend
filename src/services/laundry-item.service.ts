import prisma from "../config/prisma.config";
import { AppError } from "../utils/app-error";
import {
  CreateLaundryItemInput,
  UpdateLaundryItemInput,
  LaundryItemResponse,
  LaundryItemListQuery,
} from "../@types/laundry-item.types";

export const laundryItemService = {
  async createLaundryItem(
    input: CreateLaundryItemInput,
  ): Promise<LaundryItemResponse> {
    const { name, category, unit, basePrice } = input;

    // Cek apakah item dengan nama yang sama sudah ada (case insensitive)
    const existingItem = await prisma.laundryItem.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive",
        },
        deletedAt: null,
      },
    });

    if (existingItem) {
      throw AppError(`Laundry item with name "${name}" already exists`, 400);
    }

    // Validasi basePrice jika diberikan
    if (basePrice !== undefined && basePrice < 1000) {
      throw AppError("Base price must be at least Rp 1,000", 400);
    }

    // Buat item baru
    const item = await prisma.laundryItem.create({
      data: {
        name,
        category: category || null,
        unit: unit || null,
        basePrice: basePrice || null,
        pricingType: input.pricingType || "ITEM",
      },
    });

    return {
      id: item.id,
      name: item.name,
      category: item.category,
      unit: item.unit,
      basePrice: item.basePrice,
      pricingType: item.pricingType,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  },

  async getAllLaundryItems(query: LaundryItemListQuery) {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      pricingType,
      sortBy = "name",
      sortOrder = "asc",
    } = query;
    const skip = (page - 1) * limit;

    // Build filter
    const where: any = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
      ];
    }

    if (category) {
      where.category = {
        equals: category,
        mode: "insensitive",
      };
    }

    if (pricingType) {
      where.pricingType = pricingType;
    }

    // Get total count
    const total = await prisma.laundryItem.count({ where });

    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Get items
    const items = await prisma.laundryItem.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        _count: {
          select: {
            orderItems: true,
            stationChecks: true,
          },
        },
      },
    });

    const formattedItems: LaundryItemResponse[] = items.map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      unit: item.unit,
      basePrice: item.basePrice,
      pricingType: item.pricingType,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      usageCount: item._count.orderItems,
    }));

    return {
      data: formattedItems,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getLaundryItemById(itemId: string): Promise<
    LaundryItemResponse & {
      usageStats: {
        totalOrders: number;
        activeOrders: number;
        completedOrders: number;
      };
    }
  > {
    const item = await prisma.laundryItem.findUnique({
      where: { id: itemId, deletedAt: null },
      include: {
        _count: {
          select: {
            orderItems: true,
          },
        },
        orderItems: {
          select: {
            order: {
              select: {
                status: true,
              },
            },
          },
        },
      },
    });

    if (!item) {
      throw AppError("Laundry item not found", 404);
    }

    const activeOrders = item.orderItems.filter(
      (oi) => oi.order.status !== "COMPLETED",
    ).length;
    const completedOrders = item.orderItems.filter(
      (oi) => oi.order.status === "COMPLETED",
    ).length;

    return {
      id: item.id,
      name: item.name,
      category: item.category,
      unit: item.unit,
      basePrice: item.basePrice,
      pricingType: item.pricingType,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      usageStats: {
        totalOrders: item._count.orderItems,
        activeOrders,
        completedOrders,
      },
    };
  },

  async updateLaundryItem(
    itemId: string,
    input: UpdateLaundryItemInput,
  ): Promise<LaundryItemResponse> {
    const { name, category, unit, basePrice } = input;

    // Cek apakah item ada
    const existingItem = await prisma.laundryItem.findUnique({
      where: { id: itemId, deletedAt: null },
    });

    if (!existingItem) {
      throw AppError("Laundry item not found", 404);
    }

    // Jika name diubah, cek duplikasi
    if (name && name !== existingItem.name) {
      const duplicateItem = await prisma.laundryItem.findFirst({
        where: {
          name: {
            equals: name,
            mode: "insensitive",
          },
          deletedAt: null,
          id: { not: itemId },
        },
      });

      if (duplicateItem) {
        throw AppError(`Laundry item with name "${name}" already exists`, 400);
      }
    }

    // Validasi basePrice jika diberikan
    if (basePrice !== undefined && basePrice < 1000) {
      throw AppError("Base price must be at least Rp 1,000", 400);
    }

    // Build update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (category !== undefined) updateData.category = category;
    if (unit !== undefined) updateData.unit = unit;
    if (basePrice !== undefined) updateData.basePrice = basePrice;

    // Update item
    const updatedItem = await prisma.laundryItem.update({
      where: { id: itemId },
      data: updateData,
    });

    return {
      id: updatedItem.id,
      name: updatedItem.name,
      category: updatedItem.category,
      unit: updatedItem.unit,
      basePrice: updatedItem.basePrice,
      pricingType: updatedItem.pricingType,
      createdAt: updatedItem.createdAt,
      updatedAt: updatedItem.updatedAt,
    };
  },

  async deleteLaundryItem(itemId: string): Promise<void> {
    const item = await prisma.laundryItem.findUnique({
      where: { id: itemId, deletedAt: null },
      include: {
        _count: {
          select: {
            orderItems: true,
          },
        },
      },
    });

    if (!item) {
      throw AppError("Laundry item not found", 404);
    }

    // Cek apakah item masih digunakan di order items
    const usedInOrders = await prisma.orderItem.count({
      where: {
        laundryItemId: itemId,
        order: {
          status: {
            notIn: ["COMPLETED"],
          },
        },
      },
    });

    if (usedInOrders > 0) {
      throw AppError(
        "Cannot delete laundry item. It is still being used in active orders.",
        400,
      );
    }

    const totalUsage = item._count.orderItems;
    console.log(
      `🗑️ Deleting laundry item "${item.name}" (used ${totalUsage} times in completed orders)`,
    );

    // Soft delete
    await prisma.laundryItem.update({
      where: { id: itemId },
      data: {
        deletedAt: new Date(),
      },
    });
  },

  async getCategories(): Promise<string[]> {
    const items = await prisma.laundryItem.findMany({
      where: {
        deletedAt: null,
        category: {
          not: null,
        },
      },
      select: {
        category: true,
      },
      distinct: ["category"],
    });

    return items
      .map((item) => item.category)
      .filter((cat): cat is string => cat !== null)
      .sort();
  },

  async getPopularItems(limit: number = 10) {
    const items = await prisma.laundryItem.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            orderItems: true,
          },
        },
      },
      orderBy: {
        orderItems: {
          _count: "desc",
        },
      },
      take: limit,
    });

    return items.map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      basePrice: item.basePrice,
      usageCount: item._count.orderItems,
    }));
  },
};
