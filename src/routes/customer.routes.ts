import { Router } from "express";
import { customerController } from "../infra/container";

export const customerRoutes = Router();

customerRoutes.post("/", (req, res, next) =>
  customerController.create(req, res, next),
);
customerRoutes.get("/", (req, res, next) =>
  customerController.list(req, res, next),
);
customerRoutes.get("/:id/360", (req, res, next) =>
  customerController.getCustomer360(req, res, next),
);
customerRoutes.put("/:id", (req, res, next) =>
  customerController.update(req, res, next),
);
customerRoutes.delete("/:id", (req, res, next) =>
  customerController.delete(req, res, next),
);
