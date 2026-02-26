import { Request, Response } from "express";
import { z } from "zod";
import * as bypassService from "../services/bypass.service";
import { StationType } from "@prisma/client";

const bypassSchema = z.object({
  orderId: z.string().cuid(),
  station: z.nativeEnum(StationType),
  reason: z.string().min(5),
});

export const createBypassRequest = async (req: Request, res: Response) => {
  try {
    const userId = res.locals.payload?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

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
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: error.issues,
    });
  }

  const errorMap: Record<string, { status: number; message: string }> = {
    ORDER_NOT_FOUND: {
      status: 404,
      message: "Order not found",
    },
    ALREADY_HAS_PENDING_BYPASS: {
      status: 400,
      message:
        "You already have a pending bypass request for this order at this station. Please wait for admin review.",
    },
  };

  const mapped = errorMap[error.message];
  if (mapped) {
    return res
      .status(mapped.status)
      .json({ success: false, message: mapped.message });
  }

  console.error("❌ [BypassController Error]:", error);
  res.status(500).json({ success: false, message: "Internal Server Error" });
}
