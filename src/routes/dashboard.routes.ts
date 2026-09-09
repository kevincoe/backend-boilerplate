import { Router } from "express";
import { dashboardController } from "../infra/container";

export const dashboardRoutes = Router();

dashboardRoutes.get("/stats", (req, res, next) =>
  dashboardController.getStats(req, res, next),
);
