import { Router } from "express";
import { interactionController } from "../infra/container";

export const interactionRoutes = Router();

interactionRoutes.post("/", (req, res, next) =>
  interactionController.create(req, res, next),
);
interactionRoutes.get("/customer/:customerId", (req, res, next) =>
  interactionController.listByCustomer(req, res, next),
);
interactionRoutes.delete("/:id", (req, res, next) =>
  interactionController.delete(req, res, next),
);
