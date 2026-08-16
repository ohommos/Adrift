import type { NextFunction, Request, Response } from "express";
import { clientIp } from "../lib/geoip";

/**
 * Minimal fixed-window limiter, in memory.
 *
 * Deliberately not distributed: with more than one instance each gets its own
 * window, so this raises the cost of bulk account creation rather than
 * enforcing a hard global cap. That is the right trade for an endpoint that
 * has no other abuse control today; a shared store can replace it later
 * without changing call sites.
 */
export function rateLimit(options: { windowMs: number; max: number }) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  function sweep(now: number) {
    for (const [key, entry] of hits) {
      if (entry.resetAt <= now) hits.delete(key);
    }
  }

  return function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
    const now = Date.now();
    // Keep the map from growing without bound on a long-lived process.
    if (hits.size > 10_000) sweep(now);

    const key = clientIp(req.headers as Record<string, unknown>, req.ip) || "unknown";
    const entry = hits.get(key);

    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + options.windowMs });
      next();
      return;
    }

    if (entry.count >= options.max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader("Retry-After", String(retryAfter));
      res.status(429).json({ error: "Too many attempts — wait a moment and try again" });
      return;
    }

    entry.count += 1;
    next();
  };
}
