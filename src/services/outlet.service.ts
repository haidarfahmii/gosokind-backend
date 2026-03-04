import prisma from "../config/prisma.config";
import { AppError } from "../utils/app-error";
import { geoService } from "./geo.service";
import {
  CreateOutletInput,
  UpdateOutletInput,
  OutletResponse,
} from "../@types/outlet.types";
import { getCityCode } from "../utils/city-code.util";

export const outletService = {
  async generateOutletCode(city: string): Promise<string> {
    // ambil kata pertama dari nama kota, uppercase, hapus non-alfanumerik
    const cityCode = getCityCode(city);
    const prefix = `OUT-${cityCode}-`;

    // Hitung berapa outlet (termasuk yang sudah dihapus) dengan prefix yang sama
    // Menggunakan deleted outlets juga agar nomor urut tidak pernah duplikat
    const existingCount = await prisma.outlet.count({
      where: {
        outletCode: {
          startsWith: prefix,
        },
      },
    });

    const sequence = String(existingCount + 1).padStart(3, "0");
    return `${prefix}${sequence}`;
  },

  async getAllOutlets(
    page: number,
    limit: number,
    search?: string,
    scopedOutletId: string | null = null,
    isSuperAdmin: boolean = false,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    // Outlet scope
    if (!isSuperAdmin && scopedOutletId) {
      // Outlet admin hanya bisa lihat outletnya sendiri
      where.id = scopedOutletId;
    }

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
        { province: { contains: search, mode: "insensitive" } },
        { outletCode: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get total count
    const total = await prisma.outlet.count({ where });

    // Get outlets
    const outlets = await prisma.outlet.findMany({
      where,
      skip,
      take: limit,
      include: {
        employees: {
          where: { deletedAt: null },
          select: {
            id: true,
            fullName: true,
            role: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            employees: {
              where: { deletedAt: null },
            },
            orders: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Format response
    const formattedOutlets: OutletResponse[] = outlets.map((outlet) => ({
      id: outlet.id,
      outletCode: outlet.outletCode,
      name: outlet.name,
      address: outlet.address,
      province: outlet.province,
      city: outlet.city,
      latitude: outlet.latitude,
      longitude: outlet.longitude,
      status: outlet.status,
      employeeCount: outlet._count.employees,
      orderCount: outlet._count.orders,
      employees: outlet.employees,
      createdAt: outlet.createdAt,
      updatedAt: outlet.updatedAt,
    }));

    return {
      outlets: formattedOutlets,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getAllOutletsForDropdown(
    scopedOutletId: string | null = null,
    isSuperAdmin: boolean = false,
  ): Promise<{ id: string; name: string; outletCode: string }[]> {
    const where: any = {
      deletedAt: null,
      status: "AVAILABLE", // hanya outlet aktif untuk dropdown
    };

    // Outlet Admin hanya bisa lihat outletnya sendiri
    if (!isSuperAdmin && scopedOutletId) {
      where.id = scopedOutletId;
    }

    const outlets = await prisma.outlet.findMany({
      where,
      select: {
        id: true,
        name: true,
        outletCode: true,
      },
      orderBy: {
        name: "asc",
      },
      // Tidak ada `take` / `skip` — ambil SEMUA outlet untuk dropdown
    });

    return outlets;
  },

  async getOutletById(
    outletId: string,
    scopedOutletId: string | null = null,
    isSuperAdmin: boolean = false,
  ): Promise<OutletResponse> {
    if (!isSuperAdmin && scopedOutletId && outletId !== scopedOutletId) {
      throw AppError(
        "Forbidden: You can only view your own outlet details",
        403,
      );
    }

    const outlet = await prisma.outlet.findUnique({
      where: { id: outletId, deletedAt: null },
      include: {
        employees: {
          where: { deletedAt: null },
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            isActive: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            employees: {
              where: { deletedAt: null },
            },
            orders: true,
          },
        },
      },
    });

    if (!outlet) {
      throw AppError("Outlet not found", 404);
    }

    return {
      id: outlet.id,
      outletCode: outlet.outletCode,
      name: outlet.name,
      address: outlet.address,
      province: outlet.province,
      city: outlet.city,
      latitude: outlet.latitude,
      longitude: outlet.longitude,
      status: outlet.status,
      employeeCount: outlet._count.employees,
      orderCount: outlet._count.orders,
      employees: outlet.employees,
      createdAt: outlet.createdAt,
      updatedAt: outlet.updatedAt,
    };
  },

  async createOutlet(input: CreateOutletInput): Promise<OutletResponse> {
    const { name, province, city, address, latitude, longitude, status } =
      input;

    // Validasi koordinat wajib ada (dikirim dari Leaflet)
    if (latitude === undefined || longitude === undefined) {
      throw AppError(
        "Latitude and longitude are required. Please pick a location on the map.",
        400,
      );
    }

    // Validate coordinates
    if (!geoService.validateCoordinates(latitude, longitude)) {
      throw AppError("Invalid coordinates", 400);
    }

    // Check duplicate outlet name
    const existingOutlet = await prisma.outlet.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive",
        },
        deletedAt: null,
      },
    });

    if (existingOutlet) {
      throw AppError(`Outlet with name "${name}" already exists`, 400);
    }

    const cityForCode = city || province || "UNK";
    const outletCode = await this.generateOutletCode(cityForCode);

    // Create outlet
    const outlet = await prisma.outlet.create({
      data: {
        outletCode,
        name,
        province,
        city,
        address,
        latitude,
        longitude,
        status: status || "AVAILABLE",
      },
      include: {
        employees: {
          where: { deletedAt: null },
        },
        _count: {
          select: {
            employees: {
              where: { deletedAt: null },
            },
            orders: true,
          },
        },
      },
    });

    return {
      id: outlet.id,
      outletCode: outlet.outletCode,
      name: outlet.name,
      address: outlet.address,
      province: outlet.province,
      city: outlet.city,
      latitude: outlet.latitude,
      longitude: outlet.longitude,
      status: outlet.status,
      employeeCount: outlet._count.employees,
      orderCount: outlet._count.orders,
      employees: outlet.employees,
      createdAt: outlet.createdAt,
      updatedAt: outlet.updatedAt,
    };
  },

  async updateOutlet(
    outletId: string,
    input: UpdateOutletInput,
  ): Promise<OutletResponse> {
    // Check if outlet exists
    const existingOutlet = await prisma.outlet.findUnique({
      where: { id: outletId, deletedAt: null },
    });

    if (!existingOutlet) {
      throw AppError("Outlet not found", 404);
    }

    // Validate coordinates if provided
    if (input.latitude !== undefined && input.longitude !== undefined) {
      if (!geoService.validateCoordinates(input.latitude, input.longitude)) {
        throw AppError("Invalid coordinates", 400);
      }
    }

    // Check duplicate name if name is being updated
    if (input.name && input.name !== existingOutlet.name) {
      const duplicateOutlet = await prisma.outlet.findFirst({
        where: {
          name: {
            equals: input.name,
            mode: "insensitive",
          },
          id: {
            not: outletId,
          },
          deletedAt: null,
        },
      });

      if (duplicateOutlet) {
        throw AppError(`Outlet with name "${input.name}" already exists`, 400);
      }
    }

    // Update outlet
    const outlet = await prisma.outlet.update({
      where: { id: outletId },
      data: {
        name: input.name,
        province: input.province,
        city: input.city,
        address: input.address,
        latitude: input.latitude,
        longitude: input.longitude,
        status: input.status,
      },
      include: {
        employees: {
          where: { deletedAt: null },
        },
        _count: {
          select: {
            employees: {
              where: { deletedAt: null },
            },
            orders: true,
          },
        },
      },
    });

    return {
      id: outlet.id,
      outletCode: outlet.outletCode,
      name: outlet.name,
      address: outlet.address,
      province: outlet.province,
      city: outlet.city,
      latitude: outlet.latitude,
      longitude: outlet.longitude,
      status: outlet.status,
      employeeCount: outlet._count.employees,
      orderCount: outlet._count.orders,
      employees: outlet.employees,
      createdAt: outlet.createdAt,
      updatedAt: outlet.updatedAt,
    };
  },

  async deleteOutlet(outletId: string): Promise<void> {
    const outlet = await prisma.outlet.findUnique({
      where: { id: outletId, deletedAt: null },
      include: {
        employees: {
          where: { deletedAt: null },
        },
        orders: true,
      },
    });

    if (!outlet) {
      throw AppError("Outlet not found", 404);
    }

    // Check if outlet has active employees
    if (outlet.employees.length > 0) {
      throw AppError(
        `Cannot delete outlet: ${outlet.employees.length} employee(s) are still assigned to this outlet`,
        400,
      );
    }

    // Check if outlet has orders
    if (outlet.orders.length > 0) {
      throw AppError(
        `Cannot delete outlet: This outlet has ${outlet.orders.length} order(s) in the system`,
        400,
      );
    }

    // Soft delete
    await prisma.outlet.update({
      where: { id: outletId },
      data: {
        deletedAt: new Date(),
      },
    });
  },

  async calculateShipping(
    outletId: string,
    customerLatitude: number,
    customerLongitude: number,
    scopedOutletId: string | null = null,
    isSuperAdmin: boolean = false,
  ) {
    // OUTLET SCOPE ENFORCEMENT
    if (!isSuperAdmin && scopedOutletId && outletId !== scopedOutletId) {
      throw AppError(
        "Forbidden: You can only calculate shipping for your own outlet",
        403,
      );
    }

    // Get outlet
    const outlet = await prisma.outlet.findUnique({
      where: { id: outletId, deletedAt: null },
    });

    if (!outlet) {
      throw AppError("Outlet not found", 404);
    }

    // Validate customer coordinates
    if (!geoService.validateCoordinates(customerLatitude, customerLongitude)) {
      throw AppError("Invalid customer coordinates", 400);
    }

    // Calculate distance
    const distance = geoService.calculateDistance(
      outlet.latitude,
      outlet.longitude,
      customerLatitude,
      customerLongitude,
    );

    // Calculate shipping cost (example: Rp 5,000 per km, min Rp 10,000)
    const pricePerKm = 5000;
    const minPrice = 10000;
    const shippingCost = Math.max(Math.ceil(distance * pricePerKm), minPrice);

    return {
      outlet: {
        id: outlet.id,
        outletCode: outlet.outletCode,
        name: outlet.name,
        address: outlet.address,
        coordinates: {
          latitude: outlet.latitude,
          longitude: outlet.longitude,
        },
      },
      customer: {
        coordinates: {
          latitude: customerLatitude,
          longitude: customerLongitude,
        },
      },
      distance: `${distance} km`,
      shippingCost,
      estimatedTime: `${Math.ceil(distance / 30)} - ${Math.ceil(distance / 20)} minutes`, // Assuming 20-30 km/h average speed
    };
  },
};