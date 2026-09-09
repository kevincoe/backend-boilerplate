import { Router } from "express";
import { rentalController } from "../infra/container";

export const rentalRoutes = Router();

rentalRoutes.post("/pricing", (req, res, next) =>
  rentalController.calculatePricing(req, res, next),
);

rentalRoutes.post("/damages", (req, res, next) =>
  rentalController.reportDamage(req, res, next),
);

rentalRoutes.post("/inventory/check", (req, res, next) =>
  rentalController.checkInventory(req, res, next),
);

rentalRoutes.get("/damages/order/:orderId", (req, res, next) =>
  rentalController.getDamagesByOrder(req, res, next),
);
