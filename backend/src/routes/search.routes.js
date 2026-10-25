import { searchRecord } from "../services/SearchRecordService.js";
import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import prisma from "../config/prisma.js";
import { globalSearch } from "../services/GlobalSearchService.js";
const r = Router();
r.use(rateLimit({
  windowMs: 60000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false
}));
r.get("/", async (req, res, next) => {
  try {
    res.set("Cache-Control", "no-store").json({
      success: true,
      data: await globalSearch(prisma, req.user, req.query.q)
    });
  } catch (e) {
    next(e);
  }
});
r.get("/record", async (req, res, next) => {
  try {
    res.set("Cache-Control", "no-store").json({
      success: true,
      data: await searchRecord(prisma, req.user, req.query.type, req.query.id)
    });
  } catch (e) {
    next(e);
  }
});
export default r;
