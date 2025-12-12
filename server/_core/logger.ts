import type { Request, Response, NextFunction } from "express";

export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const envLevel = (process.env.LOG_LEVEL || "info").toLowerCase() as LogLevel;
const CURRENT_LEVEL: LogLevel = LEVEL_ORDER[envLevel] ? envLevel : "info";

function shouldLog(level: LogLevel): boolean {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[CURRENT_LEVEL];
}

function baseLog(level: LogLevel, message: string, meta?: unknown): void {
  if (!shouldLog(level)) return;
  const time = new Date().toISOString();
  if (meta !== undefined) {
    // Structured but ainda legível no console
    // eslint-disable-next-line no-console
    console.log(`[${time}] [${level.toUpperCase()}] ${message}`, meta);
  } else {
    // eslint-disable-next-line no-console
    console.log(`[${time}] [${level.toUpperCase()}] ${message}`);
  }
}

export const logger = {
  debug(message: string, meta?: unknown) {
    baseLog("debug", message, meta);
  },
  info(message: string, meta?: unknown) {
    baseLog("info", message, meta);
  },
  warn(message: string, meta?: unknown) {
    baseLog("warn", message, meta);
  },
  error(message: string, meta?: unknown) {
    baseLog("error", message, meta);
  },
};

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - start;
    logger.info("HTTP request completed", {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      durationMs,
    });
  });

  next();
}
