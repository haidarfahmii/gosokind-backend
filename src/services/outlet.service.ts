import prisma from "../config/prisma.config";
import { AppError } from "../utils/app-error";
import { geoService, GeocodingInput } from "./geo.service";
import { CreateOutletData, UpdateOutletData } from "../@types/outlet.types";

export const outletService = {
  calculateShippingPrice(distanceKm: number): number {
    const BASE_PRICE = 5000; // Base price Rp 5.000
    const PRICE_PER_KM = 2000; // Rp 2.000 per km

    // Free shipping untuk jarak < 2km
    if (distanceKm < 2) {
      return 0;
    }

    const shippingPrice = BASE_PRICE + Math.ceil(distanceKm) * PRICE_PER_KM;
    return shippingPrice;
  },

  async getAllOutlets(page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;

    // Build where clause untuk search
    const where: any = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
      ];
    }

    const [outlets, total] = await Promise.all([
      prisma.outlet.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              employees: true,
              orders: true,
            },
          },
        },
      }),
      prisma.outlet.count({ where }),
    ]);

    return {
      outlets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getOutletById(id: string) {
    const outlet = await prisma.outlet.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        employees: {
          where: { deletedAt: null },
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    if (!outlet) {
      throw AppError("Outlet not found", 404);
    }

    return outlet;
  },

  async checkLocation(input: GeocodingInput) {
    // Validasi koordinat manual jika diberikan
    if (input.latitude && input.longitude) {
      const isValid = geoService.validateCoordinates(
        input.latitude,
        input.longitude,
      );

      if (!isValid) {
        throw AppError(
          "Invalid coordinates. Latitude must be between -90 and 90, Longitude must be between -180 and 180",
          400,
        );
      }
    }

    // Panggil hybrid geocoding
    const result = await geoService.geocode(input);

    return {
      ...result,
      preview: {
        willUse:
          result.source === "manual" ? "Manual coordinates" : "OpenCage API",
        message:
          result.source === "manual"
            ? "Coordinates provided manually will be used"
            : "Coordinates fetched from OpenCage API based on address",
      },
    };
  },

  async createOutlet(data: CreateOutletData) {
    // Hybrid Geocoding via Geo Service
    const geocodeResult = await geoService.geocode({
      province: data.province,
      city: data.city,
      address: data.address,
      latitude: data.latitude,
      longitude: data.longitude,
    });

    console.log("✅ Geocoding Result:", {
      source: geocodeResult.source,
      coordinates: {
        lat: geocodeResult.latitude,
        lng: geocodeResult.longitude,
      },
      address: geocodeResult.formattedAddress,
    });

    // Validasi coordinates (double check)
    if (!geocodeResult.latitude || !geocodeResult.longitude) {
      throw AppError(
        "Failed to get valid coordinates for the outlet location",
        400,
      );
    }

    // Check duplicate outlet dengan nama yang sama
    const existingOutlet = await prisma.outlet.findFirst({
      where: {
        name: data.name,
        deletedAt: null,
      },
    });

    if (existingOutlet) {
      throw AppError(`Outlet with name "${data.name}" already exists`, 409);
    }

    // Create outlet dengan hasil geocoding
    const outlet = await prisma.outlet.create({
      data: {
        name: data.name,
        province: data.province || null,
        city: data.city || null,
        address: geocodeResult.formattedAddress,
        latitude: geocodeResult.latitude,
        longitude: geocodeResult.longitude,
        status: data.status || "AVAILABLE",
      },
    });

    // Return dengan additional info
    return {
      ...outlet,
      geocoding: {
        source: geocodeResult.source,
        usedManualCoordinates: geocodeResult.source === "manual",
      },
    };
  },

  async updateOutlet(id: string, data: UpdateOutletData) {
    // Check apakah outlet exists
    const existingOutlet = await prisma.outlet.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!existingOutlet) {
      throw AppError("Outlet not found", 404);
    }

    // Check duplicate name (jika name diupdate)
    if (data.name && data.name !== existingOutlet.name) {
      const duplicateOutlet = await prisma.outlet.findFirst({
        where: {
          name: data.name,
          deletedAt: null,
          id: { not: id },
        },
      });

      if (duplicateOutlet) {
        throw AppError(`Outlet with name "${data.name}" already exists`, 409);
      }
    }

    // Prepare update data
    const updateData: any = {};

    if (data.name) updateData.name = data.name;
    if (data.province !== undefined)
      updateData.province = data.province || null;
    if (data.city !== undefined) updateData.city = data.city || null;
    if (data.status) updateData.status = data.status;

    // Geocoding Logic
    const hasAddressChange = data.province || data.city || data.address;
    const hasManualCoordinates = data.latitude && data.longitude;

    // Jika ada perubahan address ATAU koordinat manual
    if (hasAddressChange || hasManualCoordinates) {
      const geocodeResult = await geoService.geocode({
        province: data.province,
        city: data.city,
        address: data.address || existingOutlet.address,
        latitude: data.latitude,
        longitude: data.longitude,
      });

      updateData.latitude = geocodeResult.latitude;
      updateData.longitude = geocodeResult.longitude;
      updateData.address = geocodeResult.formattedAddress;

      console.log("✅ Update Geocoding:", {
        source: geocodeResult.source,
        coordinates: {
          lat: geocodeResult.latitude,
          lng: geocodeResult.longitude,
        },
      });
    }

    // Update outlet
    const updatedOutlet = await prisma.outlet.update({
      where: { id },
      data: updateData,
    });

    return updatedOutlet;
  },

  async deleteOutlet(id: string) {
    // Check apakah outlet exists
    const outlet = await prisma.outlet.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        employees: {
          where: { deletedAt: null },
        },
        orders: {
          where: {
            status: {
              not: "COMPLETED",
            },
          },
        },
      },
    });

    if (!outlet) {
      throw AppError("Outlet not found", 404);
    }

    // Check apakah masih ada employee aktif
    if (outlet.employees.length > 0) {
      throw AppError(
        `Cannot delete outlet. There are ${outlet.employees.length} active employee(s) assigned to this outlet. Please reassign or remove them first.`,
        400,
      );
    }

    // Check apakah masih ada orders aktif
    if (outlet.orders.length > 0) {
      throw AppError(
        `Cannot delete outlet. There are ${outlet.orders.length} active order(s) at this outlet. Please complete or cancel them first.`,
        400,
      );
    }

    // Soft delete outlet
    const deletedOutlet = await prisma.outlet.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return deletedOutlet;
  },

  async calculateShipping(outletId: string, customerAddressId: string) {
    const [outlet, address] = await Promise.all([
      prisma.outlet.findFirst({
        where: { id: outletId, deletedAt: null },
      }),
      prisma.address.findFirst({
        where: { id: customerAddressId, deletedAt: null },
      }),
    ]);

    if (!outlet) {
      throw AppError("Outlet not found", 404);
    }

    if (!address) {
      throw AppError("Customer address not found", 404);
    }

    // Gunakan geo service untuk hitung jarak
    const distance = geoService.calculateDistance(
      outlet.latitude,
      outlet.longitude,
      address.latitude,
      address.longitude,
    );

    const shippingPrice = this.calculateShippingPrice(distance);

    return {
      outletId: outlet.id,
      outletName: outlet.name,
      customerAddressId: address.id,
      distance: distance,
      shippingPrice: shippingPrice,
      estimatedTime: Math.ceil(distance * 5), // 5 minutes per km
    };
  },
};
