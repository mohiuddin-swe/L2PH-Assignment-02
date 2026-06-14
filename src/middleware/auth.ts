import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import config from "../config";
import { pool } from "../db";
import type { ROLES } from "../types";

const auth = (...roles: ROLES[]) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Authorization header
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        res.status(401).json({
          success: false,
          message: "Unauthorized access!",
        });
        return;
      }

      // Support both:
      // Authorization: Bearer <token>
      // Authorization: <token>
      const token = authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : authHeader;

      if (!token) {
        res.status(401).json({
          success: false,
          message: "Token is missing!",
        });
        return;
      }

      // Verify JWT
      const decoded = jwt.verify(
        token,
        config.secret as string
      ) as JwtPayload;

      // Find user
      const userData = await pool.query(
        `
        SELECT *
        FROM users
        WHERE id = $1
        `,
        [decoded.id]
      );

      if (userData.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: "User not found!",
        });
        return;
      }

      const user = userData.rows[0];

      // Role authorization
      if (roles.length > 0 && !roles.includes(user.role)) {
        res.status(403).json({
          success: false,
          message: "Forbidden! You don't have permission.",
        });
        return;
      }

      // Attach user to request
      req.user = {
        id: user.id,
        name: user.name,
        role: user.role,
      };

      next();
    } catch (error: any) {
      console.error("JWT Error:", error);

      res.status(401).json({
        success: false,
        message: error.message || "Invalid or expired token!",
      });
    }
  };
};

export default auth;

