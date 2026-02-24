import prisma from "../config/prisma.config";
import {
  SalesReportQuery,
  SalesReportResponse,
  EmployeePerformanceQuery,
  EmployeePerformanceResponse,
  WorkerPerformanceItem,
} from "../@types/report.types";
import {
  resolveDateRange,
  resolveFilterOutletId,
  fetchOutletInfo,
  groupOrdersByPeriod,
} from "../utils/report.helpers";

export const reportService = {
  /**
   * SALES REPORT
   * Menghasilkan laporan pendapatan berdasarkan period (daily/monthly/yearly).
   *
   * Hanya menghitung order yang isPaid = true agar revenue
   * benar-benar mencerminkan uang yang sudah masuk.
   */
  async getSalesReport(
    query: SalesReportQuery,
    scopedOutletId: string | null,
    isSuperAdmin: boolean,
  ): Promise<SalesReportResponse> {
    const { period } = query;
    const { start, end } = resolveDateRange(query.startDate, query.endDate);

    const filterOutletId = resolveFilterOutletId(
      isSuperAdmin,
      scopedOutletId,
      query.outletId,
    );
    const outletInfo = await fetchOutletInfo(filterOutletId);

    // Build where clause — filter outlet opsional
    const where: any = {
      deletedAt: null,
      createdAt: { gte: start, lte: end },
    };
    if (filterOutletId) where.outletId = filterOutletId;

    // Ambil kolom minimal yang diperlukan untuk kalkulasi
    const orders = await prisma.order.findMany({
      where,
      select: { createdAt: true, totalPrice: true, isPaid: true },
      orderBy: { createdAt: "asc" },
    });

    // Group ke bucket period lalu hitung agregasi
    const data = groupOrdersByPeriod(orders, period);

    // Hitung summary dari data yang sudah digroup
    const summary = data.reduce(
      (acc, item) => {
        acc.totalOrders += item.totalOrders;
        acc.paidOrders += item.paidOrders;
        acc.totalRevenue += item.totalRevenue;
        return acc;
      },
      { totalOrders: 0, paidOrders: 0, totalRevenue: 0, avgOrderValue: 0 },
    );
    summary.avgOrderValue =
      summary.paidOrders > 0
        ? Math.round(summary.totalRevenue / summary.paidOrders)
        : 0;

    return {
      period,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      outlet: outletInfo,
      summary,
      data,
    };
  },

  /**
   * EMPLOYEE PERFORMANCE REPORT
   * Menghasilkan laporan performa karyawan (worker & driver).
   *
   * Worker : dihitung dari OrderStationProcess.completedAt dalam range
   * Driver : dihitung dari Order dengan verifikasi status agar hanya
   *          pickup/delivery yang benar-benar selesai yang terhitung
   */
  async getEmployeePerformanceReport(
    query: EmployeePerformanceQuery,
    scopedOutletId: string | null,
    isSuperAdmin: boolean,
  ): Promise<EmployeePerformanceResponse> {
    const { start, end } = resolveDateRange(query.startDate, query.endDate);

    const filterOutletId = resolveFilterOutletId(
      isSuperAdmin,
      scopedOutletId,
      query.outletId,
    );
    const outletInfo = await fetchOutletInfo(filterOutletId);

    // Jika role disediakan → filter spesifik, jika tidak → ambil semua role yang relevan
    const roleFilter = query.role
      ? query.role
      : {
          in: ["WORKER_WASHING", "WORKER_IRONING", "WORKER_PACKING", "DRIVER"],
        };

    const employeeWhere: any = {
      deletedAt: null,
      isActive: true,
      role: roleFilter,
    };
    if (filterOutletId) employeeWhere.outletId = filterOutletId;

    // Ambil semua employee yang relevan
    const employees = await prisma.employee.findMany({
      where: employeeWhere,
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        outletId: true,
        isActive: true,
        outlet: { select: { id: true, name: true } },
      },
      orderBy: { fullName: "asc" },
    });

    // Early return jika tidak ada employee
    if (employees.length === 0) {
      return {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        outlet: outletInfo,
        summary: { totalEmployees: 0, topPerformer: null },
        data: [],
      };
    }

    const employeeIds = employees.map((e) => e.id);

    // Query paralel untuk efisiensi
    // completedAt dipakai sebagai acuan waktu agar yang terhitung
    // adalah station yang benar-benar selesai dalam periode ini
    const [stationProcesses, pickedUpOrders, deliveredOrders] =
      await Promise.all([
        // Station processes yang selesai dalam range
        prisma.orderStationProcess.findMany({
          where: {
            workerId: { in: employeeIds },
            completedAt: { gte: start, lte: end },
          },
          select: { workerId: true, station: true },
        }),

        // Pickup selesai: order sudah melewati status PICKUP_ON_THE_WAY
        prisma.order.findMany({
          where: {
            pickupDriverId: { in: employeeIds },
            status: { notIn: ["WAITING_FOR_PICKUP", "PICKUP_ON_THE_WAY"] },
            updatedAt: { gte: start, lte: end },
            deletedAt: null,
          },
          select: { pickupDriverId: true },
        }),

        // Delivery selesai: order sudah diterima customer
        prisma.order.findMany({
          where: {
            deliveryDriverId: { in: employeeIds },
            status: { in: ["RECEIVED_BY_CUSTOMER", "COMPLETED"] },
            updatedAt: { gte: start, lte: end },
            deletedAt: null,
          },
          select: { deliveryDriverId: true },
        }),
      ]);

    // Bangun lookup maps
    // Map: workerId → station breakdown
    const stationMap = new Map<
      string,
      { WASHING: number; IRONING: number; PACKING: number }
    >();
    for (const sp of stationProcesses) {
      const cur = stationMap.get(sp.workerId) ?? {
        WASHING: 0,
        IRONING: 0,
        PACKING: 0,
      };
      if (sp.station === "WASHING") cur.WASHING += 1;
      else if (sp.station === "IRONING") cur.IRONING += 1;
      else if (sp.station === "PACKING") cur.PACKING += 1;
      stationMap.set(sp.workerId, cur);
    }

    // Map: driverId → jumlah pickup selesai
    const pickupMap = new Map<string, number>();
    for (const o of pickedUpOrders) {
      if (o.pickupDriverId) {
        pickupMap.set(
          o.pickupDriverId,
          (pickupMap.get(o.pickupDriverId) ?? 0) + 1,
        );
      }
    }

    // Map: driverId → jumlah delivery selesai
    const deliveryMap = new Map<string, number>();
    for (const o of deliveredOrders) {
      if (o.deliveryDriverId) {
        deliveryMap.set(
          o.deliveryDriverId,
          (deliveryMap.get(o.deliveryDriverId) ?? 0) + 1,
        );
      }
    }

    // Susun data final per employee
    const data: WorkerPerformanceItem[] = employees.map((emp) => {
      const stations = stationMap.get(emp.id) ?? {
        WASHING: 0,
        IRONING: 0,
        PACKING: 0,
      };
      const pickups = pickupMap.get(emp.id) ?? 0;
      const deliveries = deliveryMap.get(emp.id) ?? 0;
      const totalStationsCompleted =
        stations.WASHING + stations.IRONING + stations.PACKING;
      const totalJobsDone = totalStationsCompleted + pickups + deliveries;

      return {
        employeeId: emp.id,
        fullName: emp.fullName,
        email: emp.email,
        role: emp.role,
        outletId: emp.outletId,
        outletName: emp.outlet?.name ?? null,
        isActive: emp.isActive,
        totalStationsCompleted,
        washingCompleted: stations.WASHING,
        ironingCompleted: stations.IRONING,
        packingCompleted: stations.PACKING,
        totalPickups: pickups,
        totalDeliveries: deliveries,
        totalJobsDone,
      };
    });

    // Sort descending — karyawan terbanyak pekerjaan di atas
    data.sort((a, b) => b.totalJobsDone - a.totalJobsDone);

    // Top performer hanya dihitung jika ada yang punya pekerjaan > 0
    const topPerformer =
      data.length > 0 && data[0].totalJobsDone > 0
        ? {
            employeeId: data[0].employeeId,
            fullName: data[0].fullName,
            role: data[0].role,
            totalJobsDone: data[0].totalJobsDone,
          }
        : null;

    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      outlet: outletInfo,
      summary: { totalEmployees: data.length, topPerformer },
      data,
    };
  },
};
