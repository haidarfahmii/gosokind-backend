import prisma from "../../config/prisma.config";
import { AppError } from "../../utils/app-error";
import { geoService } from "../geo.service";

const PRICE_PER_KM = 5000; // Rp 5.000 per km
const MIN_SHIPPING_PRICE = 10000; // Minimum Rp 10.000

/**
 * Hitung biaya pengiriman dari outlet ke koordinat customer.
 *
 * Rules:
 * - Outlet Admin hanya bisa hitung ongkir untuk outletnya sendiri
 * - Super Admin bisa hitung untuk outlet manapun
 * - Biaya: max(jarak_km × Rp5.000, Rp10.000)
 * - Estimasi waktu berdasarkan kecepatan 20–30 km/h
 */
export async function calculateShipping(
  outletId: string,
  customerLatitude: number,
  customerLongitude: number,
  scopedOutletId: string | null = null,
  isSuperAdmin: boolean = false,
) {
  // Outlet scope enforcement
  if (!isSuperAdmin && scopedOutletId && outletId !== scopedOutletId) {
    throw AppError(
      "Forbidden: You can only calculate shipping for your own outlet",
      403,
    );
  }

  const outlet = await prisma.outlet.findUnique({
    where: { id: outletId, deletedAt: null },
  });

  if (!outlet) throw AppError("Outlet not found", 404);

  if (!geoService.validateCoordinates(customerLatitude, customerLongitude)) {
    throw AppError("Invalid customer coordinates", 400);
  }

  const distance = geoService.calculateDistance(
    outlet.latitude,
    outlet.longitude,
    customerLatitude,
    customerLongitude,
  );

  const shippingCost = Math.max(
    Math.ceil(distance * PRICE_PER_KM),
    MIN_SHIPPING_PRICE,
  );

  const etaMin = Math.ceil(distance / 30);
  const etaMax = Math.ceil(distance / 20);

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
    estimatedTime: `${etaMin} - ${etaMax} minutes`,
  };
}
