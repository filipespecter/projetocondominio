import { Router } from "express";
import prisma from "../config/prisma.js";
import { requireTrustedOrigin } from "../middlewares/securityMiddleware.js";
import { listHandovers, writeHandover, acknowledgeHandover, resolveHandover } from "../services/HandoverService.js";
import { ApiError } from "../utils/ApiError.js";
const r = Router();
r.get("/", async (req, res, next) => {
  try {
    const page = Number(req.query.page || 1);
    if (!Number.isInteger(page) || page < 1 || page > 1000) throw new ApiError("Página inválida.", 422);
    res.json({
      success: true,
      data: await listHandovers(prisma, req.user, page)
    });
  } catch (e) {
    next(e);
  }
});
r.post("/", requireTrustedOrigin, async (req, res, next) => {
  try {
    res.status(201).json({
      success: true,
      data: await writeHandover(prisma, req.user, req.body)
    });
  } catch (e) {
    next(e);
  }
});
for (const [path, fn] of [["acknowledge", acknowledgeHandover], ["resolve", resolveHandover]]) r.post(`/:id/${path}`, requireTrustedOrigin, async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: await fn(prisma, req.user, req.params.id)
    });
  } catch (e) {
    next(e);
  }
});
export default r;
