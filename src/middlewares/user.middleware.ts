import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/user.model";
import { IAuthTokenPayload, UserRole } from "../types/user.types";

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        email: string;
        role: UserRole;
    };
}

export const authenticate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as IAuthTokenPayload;

        const user = await User.findById(decoded.userId).select("_id email role isActive");

        if (!user || !user.isActive) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        req.user = { userId: decoded.userId, email: decoded.email, role: decoded.role };
        next();
    } catch {
        res.status(401).json({ success: false, message: "Invalid or expired token" });
    }
};

export const authorize = (...roles: UserRole[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user || !roles.includes(req.user.role)) {
            res.status(403).json({ success: false, message: "Forbidden" });
            return;
        }
        next();
    };
};