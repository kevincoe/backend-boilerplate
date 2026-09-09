import { Request, Response, NextFunction } from "express";
import winston from "winston";

const isProduction = process.env.NODE_ENV === "production";

// Define o formato do log com base no ambiente
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

const consoleTransport = new winston.transports.Console({
  format: isProduction
    ? logFormat
    : winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
});

const logger = winston.createLogger({
  level: isProduction ? "info" : "debug",
  format: logFormat,
  defaultMeta: { service: "backend-boilerplate" },
  transports: [
    consoleTransport,
  ],
});

export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const startTime = Date.now();

  const sanitizedHeaders = { ...req.headers };
  delete sanitizedHeaders.authorization;
  delete sanitizedHeaders.cookie;
  delete sanitizedHeaders["x-api-key"];

  // Log the request
  logger.info("Request started", {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    headers: sanitizedHeaders,
  });

  // Log response
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    logger.info("Request completed", {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    });
  });

  next();
}

export function errorLogger(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  logger.error("Unhandled error occurred", {
    error: err,
    method: req.method,
    url: req.url,
    ip: req.ip,
    stack: err.stack,
  });

  next(err);
}

export default logger;
