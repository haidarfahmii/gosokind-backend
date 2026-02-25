import { Request, Response } from "express";
import { z } from "zod";
import * as workerService from "../services/worker.service";
import { StationType, EmployeeRole } from "../generated/prisma/client";

const processOrderSchema = z.object({
  orderId: z.string().cuid(),
  station: z.nativeEnum(StationType),
  items: z.array(z.object({
    laundryItemId: z.string(),
    quantity: z.number().int().min(0)
  })).nonempty()
});

//  Worker melihat daftar pesanan yang MASUK ke stationnya
export const getOrderList = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { page, limit } = parsePagination(req.query);
    const station = mapRoleToStation(user.role); 
    
    if (!station) return res.status(400).json({ success: false, message: "Invalid Worker Role" });

    const result = await workerService.getIncomingOrders(station, page, limit);
    res.json({ success: true, ...result });
  } catch (error) { handleError(res, error); }
};

//  Worker melihat history pekerjaan pribadi
export const getJobHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { page, limit } = parsePagination(req.query);
    
    const result = await workerService.getWorkerHistory(userId, page, limit);
    res.json({ success: true, ...result });
  } catch (error) { handleError(res, error); }
};

export const processOrder = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { orderId, station, items } = processOrderSchema.parse(req.body);

    const result = await workerService.processStationOrder({
      workerId: userId, orderId, station, items
    });

    res.json({ success: true, message: "Order processed successfully", data: result });
  } catch (error) { handleError(res, error); }
};

// --- HELPERS ---

const parsePagination = (query: any) => {
  const page = parseInt(query.page as string) || 1;
  const limit = parseInt(query.limit as string) || 10;
  return { page, limit };
};

function mapRoleToStation(role: string): StationType | null {
  if (role === EmployeeRole.WORKER_WASHING) return StationType.WASHING;
  if (role === EmployeeRole.WORKER_IRONING) return StationType.IRONING;
  if (role === EmployeeRole.WORKER_PACKING) return StationType.PACKING;
  return null;
}

function handleError(res: Response, error: any) {
  if (error instanceof z.ZodError) {
    return res.status(400).json({ success: false, errors: error.issues });
  }
  const statusMap: Record<string, number> = {
    "QTY_MISMATCH": 400,
    "ORDER_NOT_FOUND": 404
  };
  const status = statusMap[error.message] || 500;
  res.status(status).json({ success: false, message: error.message });
}