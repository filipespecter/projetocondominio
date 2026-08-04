import { Router } from "express";

export const router = Router();

/**
 * =====================================================
 * ROTAS PÚBLICAS
 * =====================================================
 */

router.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "InfinityCondo API está funcionando.",
    data: {
      application: "InfinityCondo",
      company: "Star Infinity Code",
      version: "1.0.0",
      environment: process.env.NODE_ENV || "development",
      timestamp: new Date().toISOString()
    }
  });
});

router.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Servidor saudável.",
    data: {
      status: "online",
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString()
    }
  });
});

/**
 * =====================================================
 * MÓDULOS
 * =====================================================
 *
 * router.use("/auth", authRoutes);
 * router.use("/users", userRoutes);
 * router.use("/condominiums", condominiumRoutes);
 * router.use("/residential-units", residentialUnitRoutes);
 * router.use("/residents", residentRoutes);
 * router.use("/doormen", doormanRoutes);
 * router.use("/visitors", visitorRoutes);
 * router.use("/packages", packageRoutes);
 * router.use("/reservations", reservationRoutes);
 * router.use("/areas", areaRoutes);
 * router.use("/providers", providerRoutes);
 * router.use("/occurrences", occurrenceRoutes);
 * router.use("/notices", noticeRoutes);
 * router.use("/notifications", notificationRoutes);
 * router.use("/audit", auditRoutes);
 */