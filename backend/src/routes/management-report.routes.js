import {monthlySummary,monthlyDocument,closeMonth} from "../services/OperationalReviewService.js";
import { requireTrustedOrigin } from "../middlewares/securityMiddleware.js";
import {
  reportWorkspaceBoot,
  previewWorkspaceReport,
  saveReportPreset,
  reportHistory,
  archiveWorkspaceReport,
  downloadWorkspaceReport,
} from "../services/ReportWorkspaceService.js";
import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { authorizeRoles } from "../middlewares/authMiddleware.js";
import { managementReport } from "../services/ManagementReportService.js";
import { apartmentReport } from "../services/ApartmentReportService.js";
const r = Router();
r.use(
  authorizeRoles("CONDOMINIUM_ADMIN", "MANAGER"),
  rateLimit({
    windowMs: 60000,
    limit: 15,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);
const respond = (fn) => async (req, res, next) => {
  try {
    res
      .set("Cache-Control", "no-store")
      .json({ success: true, data: await fn(req) });
  } catch (e) {
    next(e);
  }
};
r.get("/monthly",respond(req=>monthlySummary(req.user,req.query.month)));
r.post("/monthly/document",requireTrustedOrigin,respond(req=>monthlyDocument(req.user,req.body)));
r.post("/monthly/close",requireTrustedOrigin,respond(req=>closeMonth(req.user,req.body)));
r.get(
  "/workspace",
  respond((req) => reportWorkspaceBoot(req.user)),
);
r.post(
  "/workspace/preview",
  requireTrustedOrigin,
  respond((req) => previewWorkspaceReport(req.user, req.body)),
);
r.post(
  "/workspace/presets",
  requireTrustedOrigin,
  respond((req) => saveReportPreset(req.user, req.body)),
);
r.get(
  "/workspace/history",
  respond((req) => reportHistory(req.user)),
);
r.post(
  "/workspace/archive",
  requireTrustedOrigin,
  respond((req) => archiveWorkspaceReport(req.user, req.body)),
);
r.get(
  "/workspace/history/:id",
  respond((req) => downloadWorkspaceReport(req.user, req.params.id)),
);
r.get("/unit", async (req, res, next) => {
  try {
    res
      .set("Cache-Control", "no-store")
      .json({
        success: true,
        data: await apartmentReport(req.user, req.query),
      });
  } catch (e) {
    next(e);
  }
});
r.get("/:subject", async (req, res, next) => {
  try {
    res
      .set("Cache-Control", "no-store")
      .json({
        success: true,
        data: await managementReport(req.user, req.params.subject, req.query),
      });
  } catch (e) {
    next(e);
  }
});
export default r;
