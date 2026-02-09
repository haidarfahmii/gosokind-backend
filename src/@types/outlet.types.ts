import { OutletStatus, Employee } from "@prisma/client";
export { OutletStatus };

export interface OpenCageResponse {
  status: {
    code: number;
    message: string;
  };
  results: Array<{
    formatted: string;
    geometry: {
      lat: number;
      lng: number;
    };
    components: {
      country: string;
      state?: string;
      city?: string;
      county?: string;
      suburb?: string;
      road?: string;
    };
  }>;
  rate: {
    limit: number;
    remaining: number;
    reset: number;
  };
}

export interface CheckLocationInput {
  province?: string;
  city?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

export interface CreateOutletInput {
  name: string;
  province?: string;
  city?: string;
  address: string;
  latitude: number;
  longitude: number;
  status?: OutletStatus;
}

export interface UpdateOutletInput {
  name?: string;
  province?: string;
  city?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  status?: OutletStatus;
}

export interface OutletResponse {
  id: string;
  name: string;
  province: string | null;
  city: string | null;
  status: OutletStatus;
  address: string;
  latitude: number;
  longitude: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  employeeCount?: number;
  orderCount?: number;
  employees?: Partial<Employee>[];
}

export interface OutletWithGeocodingInfo extends OutletResponse {
  geocoding: {
    source: "manual" | "opencage";
    usedManualCoordinates: boolean;
  };
}

export interface CalculateShippingResponse {
  outletId: string;
  outletName: string;
  customerAddressId: string;
  distance: number; // km
  shippingPrice: number; // rp
  estimatedTime: number; // minutes
}
