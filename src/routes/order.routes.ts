import { Router } from "express";
import { orderController } from "../infra/container";

export const orderRoutes = Router();

orderRoutes.post("/quotes", (req, res, next) =>
  orderController.createQuote(req, res, next),
);
orderRoutes.post("/:orderId/confirm", (req, res, next) =>
  orderController.confirmOrder(req, res, next),
);
orderRoutes.post("/:id/finish", (req, res, next) =>
  orderController.finishOrder(req, res, next),
);
orderRoutes.get("/", (req, res, next) =>
  orderController.listOrders(req, res, next),
);
orderRoutes.put("/:id", (req, res, next) =>
  orderController.update(req, res, next),
);
orderRoutes.delete("/:id", (req, res, next) =>
  orderController.delete(req, res, next),
);
