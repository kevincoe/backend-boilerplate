import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { GetDashboardStatsService } from "../services/GetDashboardStatsService";
import { DashboardController } from "../controllers/DashboardController";

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const getDashboardStatsService = new GetDashboardStatsService(prisma);
const dashboardController = new DashboardController(getDashboardStatsService);

export const dashboardRoutes = Router();

dashboardRoutes.get("/stats", (req, res, next) =>
  dashboardController.getStats(req, res, next),
);
