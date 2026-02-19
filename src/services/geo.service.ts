import { AppError } from "../utils/app-error";
import { OPENCAGE_API_KEY } from "../config/index.config";

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  source: "manual" | "opencage"; // Menandakan sumber koordinat
}

export interface GeocodingInput {
  province?: string;
  city?: string;
  address: string;
  latitude?: number;
  longitude?: number;
}

interface OpenCageResponse {
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

export const geoService = {
  async geocode(input: GeocodingInput): Promise<GeocodingResult> {
    // STRATEGY 1: Manual Coordinates (Prioritas Tertinggi)
    if (input.latitude && input.longitude) {
      console.log("📍 Using manual coordinates:", {
        lat: input.latitude,
        lng: input.longitude,
      });

      return {
        latitude: input.latitude,
        longitude: input.longitude,
        formattedAddress: input.address, // Gunakan address input as-is
        source: "manual",
      };
    }

    // STRATEGY 2: OpenCage API Geocoding (Fallback)
    console.log("🌍 Manual coordinates not provided, calling OpenCage API...");

    if (!input.province || !input.city) {
      throw AppError(
        "Province and City are required when coordinates are not provided",
        400,
      );
    }

    const result = await this.getCoordinatesFromOpenCage(
      input.province,
      input.city,
      input.address,
    );

    return {
      ...result,
      source: "opencage",
    };
  },

  async getCoordinatesFromOpenCage(
    province: string,
    city: string,
    address: string,
  ): Promise<Omit<GeocodingResult, "source">> {
    // Validasi API Key
    if (!OPENCAGE_API_KEY) {
      throw AppError(
        "OpenCage API key is not configured. Please add OPENCAGE_API_KEY to .env file",
        500,
      );
    }

    // Format query: "address, city, province, Indonesia"
    const query = encodeURIComponent(
      `${address}, ${city}, ${province}, Indonesia`,
    );

    const url = `https://api.opencagedata.com/geocode/v1/json?q=${query}&key=${OPENCAGE_API_KEY}&language=id&countrycode=id&limit=1`;

    console.log("🔍 OpenCage API Request:", {
      query: `${address}, ${city}, ${province}, Indonesia`,
      url: url.replace(OPENCAGE_API_KEY, "***KEY_HIDDEN***"),
    });

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw AppError(
          `OpenCage API error: ${response.statusText}`,
          response.status,
        );
      }

      const data: OpenCageResponse = await response.json();

      // Log rate limit info
      console.log("📊 OpenCage API Rate Limit:", {
        limit: data.rate.limit,
        remaining: data.rate.remaining,
        reset: new Date(data.rate.reset * 1000).toISOString(),
      });

      if (data.status.code !== 200) {
        throw AppError(
          `OpenCage API returned error: ${data.status.message}`,
          400,
        );
      }

      if (!data.results || data.results.length === 0) {
        throw AppError(
          "Location not found. Please check the address, city, and province",
          404,
        );
      }

      const result = data.results[0];

      console.log("✅ OpenCage Geocoding Success:", {
        input: `${address}, ${city}, ${province}`,
        formatted: result.formatted,
        coordinates: {
          lat: result.geometry.lat,
          lng: result.geometry.lng,
        },
        components: result.components,
      });

      return {
        latitude: result.geometry.lat,
        longitude: result.geometry.lng,
        formattedAddress: result.formatted,
      };
    } catch (error: any) {
      // Enhanced error handling
      if (error.isOperational) {
        throw error; // AppError sudah di-throw, langsung lempar ulang
      }

      // Network atau parsing error
      console.error("❌ OpenCage API Error:", error);
      throw AppError(
        `Failed to geocode address: ${error.message || "Unknown error"}`,
        500,
      );
    }
  },

  async reverseGeocode(latitude: number, longitude: number): Promise<string> {
    if (!OPENCAGE_API_KEY) {
      throw AppError("OpenCage API key is not configured", 500);
    }

    const query = `${latitude},${longitude}`;
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${query}&key=${OPENCAGE_API_KEY}&language=id`;

    try {
      const response = await fetch(url);
      const data: OpenCageResponse = await response.json();

      if (data.status.code !== 200 || !data.results.length) {
        throw AppError("Failed to reverse geocode coordinates", 404);
      }

      return data.results[0].formatted;
    } catch (error: any) {
      console.error("❌ Reverse Geocoding Error:", error);
      throw AppError(`Failed to reverse geocode: ${error.message}`, 500);
    }
  },

  validateCoordinates(latitude: number, longitude: number): boolean {
    return (
      latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180
    );
  },

  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Radius bumi dalam kilometer
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 100) / 100; // Round to 2 decimal places
  },

  // Helper: Convert degrees to radians
  toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  },
};
