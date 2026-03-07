import prisma from "../../config/prisma.config";
import { AppError } from "../../utils/app-error";
import {
  CreateBypassRequestInput,
  HandleBypassRequestInput,
  BypassRequestResponse,
} from "../../@types/order.types";
import { BypassStatus } from "@prisma/client";
import { getNextStatus } from "./order.helpers";

export const bypassService = {
  // Membuat bypass request dimana worker membuat request ketika item tidak match
  async createBypassRequest(
    input: CreateBypassRequestInput,
    workerId: string,
    scopedOutletId: string | null,
  ): Promise<BypassRequestResponse> {
    const worker = await prisma.employee.findUnique({
      where: { id: workerId, deletedAt: null },
      select: { id: true, outletId: true, role: true },
    });

    if (!worker) {
      throw AppError("Worker not found", 404);
    }

    const order = await prisma.order.findUnique({
      where: { id: input.orderId, deletedAt: null },
      include: {
        orderItems: true,
        stationProcesses: {
          where: {
            workerId,
            station: input.station,
            completedAt: null,
          },
        },
      },
    });

    if (!order) throw AppError("Order not found", 404);

    // Validasi outlet scope
    if (scopedOutletId && order.outletId !== scopedOutletId) {
      throw AppError(
        "Forbidden: You can only create bypass requests for orders from your outlet",
        403,
      );
    }

    // validasi worker bekerja di station nya
    if (order.stationProcesses.length === 0) {
      throw AppError(
        "You must be working on this order at this station to create a bypass request",
        400,
      );
    }

    const currentProcess = order.stationProcesses[0];

    // Periksa apakah ada permintaan bypass yang tertunda
    const existingBypass = await prisma.bypassRequest.findFirst({
      where: {
        orderId: input.orderId,
        workerId,
        station: input.station,
        status: BypassStatus.PENDING,
      },
    });

    if (existingBypass) {
      throw AppError(
        "You already have a pending bypass request for this order",
        400,
      );
    }

    // Verifikasi bahwa semua barang laundry ada
    const laundryItemIds = input.itemChecks.map((item) => item.laundryItemId);
    const laundryItems = await prisma.laundryItem.findMany({
      where: {
        id: { in: laundryItemIds },
        deletedAt: null,
      },
    });

    if (laundryItems.length !== laundryItemIds.length) {
      throw AppError("One or more laundry items not found", 404);
    }

    // Buat permintaan bypass dengan pemeriksaan item dalam sebuah transaksi
    const bypassRequest = await prisma.$transaction(async (tx) => {
      const bypass = await tx.bypassRequest.create({
        data: {
          orderId: input.orderId,
          workerId,
          station: input.station,
          reason: input.reason,
          status: BypassStatus.PENDING,
        },
      });

      // buat pemeriksaan item dalam proses station
      await tx.stationItemCheck.createMany({
        data: input.itemChecks.map((item) => ({
          processId: currentProcess.id,
          laundryItemId: item.laundryItemId,
          inputQuantity: item.inputQuantity,
        })),
      });

      return bypass;
    });

    const result = await prisma.bypassRequest.findUnique({
      where: { id: bypassRequest.id },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
          },
        },
        worker: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    return {
      id: result!.id,
      order: result!.order,
      worker: result!.worker,
      station: result!.station,
      reason: result!.reason,
      status: result!.status,
      adminNote: result!.adminNote,
      reviewedBy: result!.reviewedBy,
      createdAt: result!.createdAt,
      updatedAt: result!.updatedAt,
    };
  },

  // Handle bypass req dimana admin bisa approve/reject req
  async handleBypassRequest(
    bypassRequestId: string,
    input: HandleBypassRequestInput,
    adminId: string,
    scopedOutletId: string | null,
    isSuperAdmin: boolean,
  ): Promise<BypassRequestResponse> {
    const bypassRequest = await prisma.bypassRequest.findUnique({
      where: { id: bypassRequestId },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            outletId: true,
            status: true,
          },
        },
        worker: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    if (!bypassRequest) {
      throw AppError("Bypass request not found", 404);
    }

    // Validasi outlet scope
    if (
      !isSuperAdmin &&
      scopedOutletId &&
      bypassRequest.order.outletId !== scopedOutletId
    ) {
      throw AppError(
        "Forbidden: You can only handle bypass requests from your outlet",
        403,
      );
    }

    // Status validasi masih tertunda
    if (bypassRequest.status !== BypassStatus.PENDING) {
      throw AppError("This bypass request has already been handled", 400);
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedBypass = await tx.bypassRequest.update({
        where: { id: bypassRequestId },
        data: {
          status:
            input.action === "APPROVED"
              ? BypassStatus.APPROVED
              : BypassStatus.REJECTED,
          adminNote: input.adminNote,
          reviewedBy: adminId,
        },
      });

      // Dapatkan proses stasiun saat ini untuk pesanan dan stasiun
      const currentProcess = await tx.orderStationProcess.findFirst({
        where: {
          orderId: bypassRequest.order.id,
          station: bypassRequest.station,
          completedAt: null,
        },
        include: {
          itemChecks: true,
        },
      });

      if (!currentProcess) {
        throw AppError("Active station process not found", 404);
      }

      // Jika diterima (approved), akan lanjutkan proses order ke status berikutnya
      if (input.action === "APPROVED") {
        console.log(
          `Bypass request APPROVED for order ${bypassRequest.order.orderNumber}`,
        );

        // step1: selesai proses station saat ini
        await tx.orderStationProcess.update({
          where: { id: currentProcess.id },
          data: { completedAt: new Date() },
        });
        console.log(
          `Station ${bypassRequest.station} process completed for order ${bypassRequest.order.orderNumber}`,
        );

        // step2: pindah ke status berikutnya
        const currentOrderStatus = bypassRequest.order.status;
        const nextStatus = getNextStatus(currentOrderStatus);

        // akan benar pindah ke status berikutnya jika nextStatus adalah salah satu dari station statuses
        if (nextStatus !== currentOrderStatus) {
          await tx.order.update({
            where: { id: bypassRequest.order.id },
            data: { status: nextStatus },
          });
          console.log(
            `Order moved from ${currentOrderStatus} to ${nextStatus}`,
          );
        } else {
          console.log(
            `Order stays at ${currentOrderStatus} (no auto-transition)`,
          );
        }
      }
      // jika ditolak (rejected), data akan di clear untuk input ulang
      else if (input.action === "REJECTED") {
        console.log(
          `Bypass request REJECTED for order ${bypassRequest.order.orderNumber}`,
        );

        // clear semua item check dari worker
        if (currentProcess.itemChecks.length > 0) {
          await tx.stationItemCheck.deleteMany({
            where: { processId: currentProcess.id },
          });
          console.log(
            `Cleared ${currentProcess.itemChecks.length} item checks`,
          );
        }
        console.log(
          `Worker ${bypassRequest.worker.fullName} must re-input data correctly`,
        );
      }

      return updatedBypass;
    });

    return {
      id: result.id,
      order: bypassRequest.order,
      worker: bypassRequest.worker,
      station: result.station,
      reason: result.reason,
      status: result.status,
      adminNote: result.adminNote,
      reviewedBy: result.reviewedBy,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };
  },

  // untuk melihat pending request
  async getPendingBypassRequests(
    page: number = 1,
    limit: number = 10,
    outletId: string | undefined,
    scopedOutletId: string | null,
    isSuperAdmin: boolean,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {
      status: BypassStatus.PENDING,
    };

    // Outlet scope
    if (!isSuperAdmin && scopedOutletId) {
      where.order = {
        outletId: scopedOutletId,
      };
    } else if (isSuperAdmin && outletId) {
      where.order = {
        outletId,
      };
    }

    // Get total count
    const total = await prisma.bypassRequest.count({ where });

    // Get bypass requests
    const bypassRequests = await prisma.bypassRequest.findMany({
      where,
      skip,
      take: limit,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            outletId: true,
            outlet: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        worker: {
          select: {
            id: true,
            fullName: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      bypassRequests: bypassRequests.map((br) => ({
        id: br.id,
        order: {
          id: br.order.id,
          orderNumber: br.order.orderNumber,
          outlet: br.order.outlet,
        },
        worker: br.worker,
        station: br.station,
        reason: br.reason,
        status: br.status,
        adminNote: br.adminNote,
        reviewedBy: br.reviewedBy,
        createdAt: br.createdAt,
        updatedAt: br.updatedAt,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },
};
