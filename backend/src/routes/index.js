import { Router } from "express";

export const router = Router();

router.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "InfinityCondo API está funcionando.",
    data: {
      application: "InfinityCondo",
      company: "Star Infinity Code",
      version: "1.0.0",
      environment:
        process.env.NODE_ENV || "development",
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