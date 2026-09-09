import { Router } from "express";
import { kitController } from "../infra/container";

export const kitRoutes = Router();

kitRoutes.post("/", (req, res, next) => kitController.create(req, res, next));
kitRoutes.get("/", (req, res, next) => kitController.list(req, res, next));
kitRoutes.patch("/:id/favorite", (req, res, next) =>
  kitController.toggleFavorite(req, res, next),
);
