import prisma from "../../config/prisma.config";
import { AppError } from "../../utils/app-error";
import { geoService } from "../geo.service";
import {
  CreateOutletInput,
  UpdateOutletInput,
  OutletResponse,
} from "../../@types/outlet.types";
import { formatOutletResponse, outletInclude } from "./outlet.helpers";
import { generateOutletCode } from "./outlet-code.service";

export async function createOutlet(
  input: CreateOutletInput,
): Promise<OutletResponse> {
  const { name, province, city, address, latitude, longitude, status } = input;

  // Koordinat wajib ada (dikirim dari Leaflet map picker)
  if (latitude === undefined || longitude === undefined) {
    throw AppError(
      "Latitude and longitude are required. Please pick a location on the map.",
      400,
    );
  }

  if (!geoService.validateCoordinates(latitude, longitude)) {
    throw AppError("Invalid coordinates", 400);
  }

  // Cek duplikasi nama outlet
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
  const outletCode = await generateOutletCode(cityForCode);

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
    include: outletInclude,
  });

  return formatOutletResponse(outlet);
}

export async function updateOutlet(
  outletId: string,
  input: UpdateOutletInput,
): Promise<OutletResponse> {
  const existingOutlet = await prisma.outlet.findUnique({
    where: { id: outletId, deletedAt: null },
  });

  if (!existingOutlet) throw AppError("Outlet not found", 404);

  // Validasi koordinat jika disertakan
  if (input.latitude !== undefined && input.longitude !== undefined) {
    if (!geoService.validateCoordinates(input.latitude, input.longitude)) {
      throw AppError("Invalid coordinates", 400);
    }
  }

  // Cek duplikasi nama jika nama diubah
  if (input.name && input.name !== existingOutlet.name) {
    const duplicateOutlet = await prisma.outlet.findFirst({
      where: {
        name: { equals: input.name, mode: "insensitive" },
        id: { not: outletId },
        deletedAt: null,
      },
    });

    if (duplicateOutlet) {
      throw AppError(`Outlet with name "${input.name}" already exists`, 400);
    }
  }

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
    include: outletInclude,
  });

  return formatOutletResponse(outlet);
}

export async function deleteOutlet(outletId: string): Promise<void> {
  const outlet = await prisma.outlet.findUnique({
    where: { id: outletId, deletedAt: null },
    include: {
      employees: { where: { deletedAt: null } },
      orders: true,
    },
  });

  if (!outlet) throw AppError("Outlet not found", 404);

  // Cek apabila outlet memiliki employee
  if (outlet.employees.length > 0) {
    throw AppError(
      `Cannot delete outlet: ${outlet.employees.length} employee(s) are still assigned to this outlet`,
      400,
    );
  }

  // cek apabila outlet memiliki order
  if (outlet.orders.length > 0) {
    throw AppError(
      `Cannot delete outlet: This outlet has ${outlet.orders.length} order(s) in the system`,
      400,
    );
  }

  await prisma.outlet.update({
    where: { id: outletId },
    data: { deletedAt: new Date() },
  });
}
