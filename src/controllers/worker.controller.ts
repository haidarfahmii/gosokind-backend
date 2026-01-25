import { Request, Response } from "express";
import { z } from "zod";
import * as workerService from "../services/worker.service";
import { StationType } from "../generated/prisma/client";

const processOrderSchema = z.object({
  orderId: z.string(),
  workerId: z.string(),
  station: z.nativeEnum(StationType),
  items: z.array(
    z.object({
      laundryItemId: z.string(),
      quantity: z.number().int().nonnegative(),
    })
  ),
});

export const processOrder = async (req: Request, res: Response) => {
  try {
    const payload = processOrderSchema.parse(req.body);

    const result = await workerService.processStationOrder(payload);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) { // Type 'any' used to safely access message property
    if (error.message === "QTY_MISMATCH") {
      res.status(400).json({
        success: false,
        code: "QTY_MISMATCH",
        message: "Quantity mismatch between input and system records.",
      });
      return; // Ensure return
    }

    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: "Validation Error",
        errors: (error as any).errors,
      });
      return;
    }

    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
