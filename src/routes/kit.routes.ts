import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { KitController } from "../controllers/KitController";
import { KitRepository } from "../repositories/KitRepository";
import { CreateKitService } from "../services/CreateKitService";
import { ListKitsService } from "../services/ListKitsService";
import { ToggleFavoriteKitService } from "../services/ToggleFavoriteKitService";

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const kitRepository = new KitRepository(prisma);

const createKitService = new CreateKitService(kitRepository);
const listKitsService = new ListKitsService(kitRepository);
const toggleFavoriteKitService = new ToggleFavoriteKitService(kitRepository);

const kitController = new KitController(
  createKitService,
  listKitsService,
  toggleFavoriteKitService
);

export const kitRoutes = Router();

kitRoutes.post("/", (req, res, next) => kitController.create(req, res, next));
kitRoutes.get("/", (req, res, next) => kitController.list(req, res, next));
kitRoutes.patch("/:id/favorite", (req, res, next) => kitController.toggleFavorite(req, res, next));
