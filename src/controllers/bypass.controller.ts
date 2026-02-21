import { Request, Response } from "express";
import { z } from "zod";
import * as bypassService from "../services/bypass.service";
import { StationType } from "../generated/prisma/client";

const bypassSchema = z.object({
  orderId: z.string().cuid(),
  station: z.nativeEnum(StationType),
  reason: z.string().min(5),
});

export const createBypassRequest = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const body = bypassSchema.parse(req.body);

    const result = await bypassService.createBypassRequest({
      workerId: userId,
      ...body,
    });

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    handleError(res, error);
  }
};

// --- PRIVATE HELPERS ---

function handleError(res: Response, error: any) {
  if (error instanceof z.ZodError) {
    res.status(400).json({ success: false, errors: error.issues });
    return;
  }
  
  if (error.message === "ORDER_NOT_FOUND") {
    res.status(404).json({ success: false, message: "Order not found" });
    return;
  }

  console.error(error);
  res.status(500).json({ success: false, message: "Internal Server Error" });
}
