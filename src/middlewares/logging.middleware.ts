import { Request, Response, NextFunction } from "express";
import winston from "winston";

// Create a Winston logger instance
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: { service: "backend-boilerplate" },
  transports: [
    // Write all logs with importance level of info or less to `combined.log`
    new winston.transports.File({ filename: "logs/combined.log" }),

    // Write all logs with importance level of error or less to `error.log`
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
  ],
});

// If we're not in production, also log to the console
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  );
}

export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const startTime = Date.now();

  // Log the request
  logger.info("Request started", {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    headers: req.headers,
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
