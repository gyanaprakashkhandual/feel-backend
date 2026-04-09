import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { IUserDocument } from "../models/user.model";
import { IAuthTokenPayload, IAuthResponse } from "../types/user.types";
import { AuthRequest } from "../middlewares/user.middleware";

const generateAccessToken = (payload: IAuthTokenPayload): string => {
    return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: "15m" });
};

const generateRefreshToken = (payload: IAuthTokenPayload): string => {
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, { expiresIn: "7d" });
};

const buildAuthResponse = (user: IUserDocument): IAuthResponse => {
    const payload: IAuthTokenPayload = {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
    };

    return {
        user: user.toJSON() as IAuthResponse["user"],
        accessToken: generateAccessToken(payload),
        refreshToken: generateRefreshToken(payload),
    };
};

export const oauthCallback = (req: Request, res: Response): void => {
    try {
        const user = req.user as IUserDocument;

        if (!user) {
            res.redirect(`${process.env.CLIENT_URL}/auth/error?message=Authentication failed`);
            return;
        }

        const { accessToken, refreshToken } = buildAuthResponse(user);

        // Check if this is first login
        const isFirstLogin = !user.lastLoginAt;

        // Update last login timestamp
        user.lastLoginAt = new Date();
        user.save(); // Don't await to avoid blocking response

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.redirect(
            `${process.env.CLIENT_URL}/auth/callback?accessToken=${accessToken}&isFirstLogin=${isFirstLogin}`
        );
    } catch {
        res.redirect(`${process.env.CLIENT_URL}/auth/error?message=Server error`);
    }
};

export const refreshAccessToken = (req: Request, res: Response): void => {
    const token = req.cookies?.refreshToken;

    if (!token) {
        res.status(401).json({ success: false, message: "No refresh token" });
        return;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as IAuthTokenPayload;

        const payload: IAuthTokenPayload = {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role,
        };

        const accessToken = generateAccessToken(payload);

        res.status(200).json({ success: true, accessToken });
    } catch {
        res.status(401).json({ success: false, message: "Invalid or expired refresh token" });
    }
};

export const logout = (_req: Request, res: Response): void => {
    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
    });

    res.status(200).json({ success: true, message: "Logged out" });
};

export const getMe = (req: Request, res: Response): void => {
    const user = (req as AuthRequest).user;

    if (!user) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
    }

    res.status(200).json({ success: true, user });
};