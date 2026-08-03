import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { AppError } from "../errors/AppError";
import logger from "./logging.middleware";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
) {
  if (err instanceof AppError) {
    logger.warn("Application error", {
      error: err.message,
      statusCode: err.statusCode,
      url: req.originalUrl,
      method: req.method,
    });
    return res.status(err.statusCode).json({ error: err.message });
  }

  if (err instanceof z.ZodError) {
    logger.warn("Validation error", {
      details: err.flatten(),
      url: req.originalUrl,
      method: req.method,
    });
    return res
      .status(400)
      .json({ error: "Validation failed", details: err.errors });
  }

  logger.error("Internal Server Error", { error: err.message, stack: err.stack });
  return res.status(500).json({ error: "Internal server error" });
}
