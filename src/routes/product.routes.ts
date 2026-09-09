import { Router } from "express";
import { productController } from "../infra/container";

export const productRoutes = Router();

// GET /api/products
productRoutes.get("/", (req, res, next) => productController.index(req, res, next));

// POST /api/products
productRoutes.post("/", (req, res, next) => productController.create(req, res, next));

// PUT /api/products/:id
productRoutes.put("/:id", (req, res, next) => productController.update(req, res, next));

// PATCH /api/products/:id/stock
productRoutes.patch("/:id/stock", (req, res, next) =>
  productController.updateStock(req, res, next),
);

// DELETE /api/products/:id
productRoutes.delete("/:id", (req, res, next) => productController.delete(req, res, next));
