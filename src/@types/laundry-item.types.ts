export interface CreateLaundryItemInput {
  name: string;
  category?: string;
  unit?: string;
  basePrice?: number;
}

export interface UpdateLaundryItemInput {
  name?: string;
  category?: string;
  unit?: string;
  basePrice?: number;
}

export interface LaundryItemResponse {
  id: string;
  name: string;
  category: string | null;
  unit: string | null;
  basePrice: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LaundryItemListQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  sortBy?: "name" | "category" | "basePrice" | "createdAt";
  sortOrder?: "asc" | "desc";
}

// Helper untuk predefined categories
export const LAUNDRY_ITEM_CATEGORIES = [
  "Atasan",
  "Bawahan",
  "Linen",
  "Bed Cover",
  "Boneka",
  "Sepatu",
  "Tas",
  "Aksesoris",
  "Lainnya",
] as const;

export type LaundryItemCategory = (typeof LAUNDRY_ITEM_CATEGORIES)[number];

// Helper untuk predefined units
export const LAUNDRY_ITEM_UNITS = ["Pcs", "Kg", "Set", "Pasang"] as const;

export type LaundryItemUnit = (typeof LAUNDRY_ITEM_UNITS)[number];
