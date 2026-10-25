import UserSessionService from "../services/UserSessionService.js";
import { Router } from "express";
import { z } from "zod";
import prisma from "../config/prisma.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { requireTrustedOrigin } from "../middlewares/securityMiddleware.js";
import { idleMinutes, sessionDeadline } from "../utils/sessionIdle.js";
import { ApiError } from "../utils/ApiError.js";
const routes = Router();
routes.use(authMiddleware);
async function status(req) {
  const [user, session] = await Promise.all([prisma.user.findUnique({
    where: {
      id: req.user.id
    },
    select: {
      idleTimeoutMinutes: true
    }
  }), prisma.authSession.findUnique({
    where: {
      id: req.auth.payload.sid
    }
  })]);
  return {
    minutes: idleMinutes(user.idleTimeoutMinutes),
    expirationReason: +session.expiresAt <= sessionDeadline(session,user) ? "expiracao" : "inatividade",
    expiresAt: new Date(sessionDeadline(session, user)).toISOString()
  };
}
routes.get("/", async (req, res, next) => {
  try {
    res.set("Cache-Control", "no-store").json({
      success: true,
      data: await status(req)
    });
  } catch (e) {
    next(e);
  }
});
routes.patch("/", requireTrustedOrigin, async (req, res, next) => {
  try {
    const parsed = z.object({
      minutes: z.union([z.literal(15), z.literal(30), z.literal(45), z.literal(60)])
    }).strict().safeParse(req.body);
    if (!parsed.success) throw new ApiError("Selecione 15, 30, 45 ou 60 minutos.", 422);
    await prisma.user.update({
      where: {
        id: req.user.id
      },
      data: {
        idleTimeoutMinutes: parsed.data.minutes
      }
    });
    res.json({
      success: true,
      data: await status(req)
    });
  } catch (e) {
    next(e);
  }
});
routes.post("/activity", requireTrustedOrigin, async (req, res, next) => {
  try {
    // This endpoint is called only after a real browser interaction, never by polling.
    // Client activity is advisory, not proof of physical presence or worked hours.
    const updated = await prisma.authSession.updateMany({
      where: {
        id: req.auth.payload.sid,
        userId: req.user.id,
        revokedAt: null
      },
      data: {
        lastInteractionAt: new Date()
      }
    });
    if (updated.count !== 1) throw new ApiError("Sessão encerrada.", 401);
    void UserSessionService.touch(req.user.id, req.auth.payload.sid).catch(() => {});
    res.json({
      success: true,
      data: await status(req)
    });
  } catch (e) {
    next(e);
  }
});
export default routes;
