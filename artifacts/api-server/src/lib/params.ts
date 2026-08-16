import type { Request } from "express";

// Express 5 types a route param as `string | string[]`, since a pattern can
// bind the same name more than once. None of our routes do, so narrow to the
// first value and keep the call sites readable.
export function routeParam(req: Request, name: string): string {
  const value = req.params[name];
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}
