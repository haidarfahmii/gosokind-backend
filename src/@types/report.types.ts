export type ReportPeriod = "daily" | "monthly" | "yearly";

// Sales Report

export interface SalesReportQuery {
  period: ReportPeriod; // daily | monthly | yearly
  startDate?: string; // ISO date (YYYY-MM-DD) (opsional, default: awal bulan ini)
  endDate?: string; // ISO date (YYYY-MM-DD) (opsional, default: hari ini)
  outletId?: string; // Super Admin: filter outlet tertentu
}

export interface SalesReportItem {
  period: string; // e.g. "2025-01-15" | "2025-01" | "2025"
  totalOrders: number; // semua order dalam periode ini
  paidOrders: number; // order yang sudah dibayar
  totalRevenue: number; // total pendapatan dari paid orders
  avgOrderValue: number; // rata-rata nilai order (totalRevenue / paidOrders)
}

export interface SalesReportSummary {
  totalOrders: number;
  paidOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
}

export interface SalesReportResponse {
  period: ReportPeriod;
  startDate: string; // ISO string tanggal mulai yang digunakan
  endDate: string; // ISO string tanggal akhir yang digunakan
  outlet: { id: string; name: string } | null; // null = semua outlet (super admin)
  summary: SalesReportSummary;
  data: SalesReportItem[];
}

// Employee Performance Report

export interface EmployeePerformanceQuery {
  startDate?: string; // ISO date (opsional)
  endDate?: string; // ISO date (opsional)
  outletId?: string; // Super Admin: filter outlet tertentu
  role?: string; // filter: "WORKER_WASHING" | "WORKER_IRONING" | "WORKER_PACKING" | "DRIVER"
}

export interface WorkerPerformanceItem {
  employeeId: string;
  fullName: string;
  email: string;
  role: string;
  outletId: string | null;
  outletName: string | null;
  isActive: boolean;

  // Statistik station — hanya relevan untuk WORKER_*
  totalStationsCompleted: number;
  washingCompleted: number;
  ironingCompleted: number;
  packingCompleted: number;

  // Statistik driver — hanya relevan untuk DRIVER
  totalPickups: number;
  totalDeliveries: number;

  // Gabungan semua pekerjaan (stations + pickups + deliveries)
  totalJobsDone: number;
}

export interface EmployeePerformanceSummary {
  totalEmployees: number;
  topPerformer: {
    employeeId: string;
    fullName: string;
    role: string;
    totalJobsDone: number;
  } | null;
}

export interface EmployeePerformanceResponse {
  startDate: string;
  endDate: string;
  outlet: { id: string; name: string } | null; // null = semua outlet
  summary: EmployeePerformanceSummary;
  data: WorkerPerformanceItem[];
}
