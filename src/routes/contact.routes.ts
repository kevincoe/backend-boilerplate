import { Router } from "express";
import { contactController } from "../infra/container";

export const contactRoutes = Router();

contactRoutes.post("/", (req, res, next) =>
  contactController.create(req, res, next),
);
contactRoutes.get("/customer/:customerId", (req, res, next) =>
  contactController.listByCustomer(req, res, next),
);
contactRoutes.put("/:id", (req, res, next) =>
  contactController.update(req, res, next),
);
contactRoutes.delete("/:id", (req, res, next) =>
  contactController.delete(req, res, next),
);
