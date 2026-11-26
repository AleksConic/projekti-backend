import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  userId?: number;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as { id: number };
    req.userId = payload.id;
    next();
  } catch {
    res.status(401).json({ error: "Niste prijavljeni" });
  }
}
