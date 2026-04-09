import { Request, Response, NextFunction } from "express";
import { body, param, validationResult } from "express-validator";
import Profile from "../models/profile.model";
import { AuthRequest } from "../middlewares/user.middleware";

export const requireProfileOwner = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = (req as AuthRequest).user.userId;
        const profile = await Profile.findOne({ userId });

        if (!profile) {
            res.status(404).json({ success: false, message: "Profile not found" });
            return;
        }

        next();
    } catch {
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export const requireNoProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = (req as AuthRequest).user.userId;
        const profile = await Profile.findOne({ userId });

        if (profile) {
            res.status(409).json({ success: false, message: "Profile already exists" });
            return;
        }

        next();
    } catch {
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export const requireSpotifyConnected = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = (req as AuthRequest).user.userId;
        const profile = await Profile.findOne({ userId }).select("integrations");

        if (!profile?.integrations?.spotify?.connected) {
            res.status(403).json({ success: false, message: "Spotify not connected" });
            return;
        }

        next();
    } catch {
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export const requireGoogleConnected = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = (req as AuthRequest).user.userId;
        const profile = await Profile.findOne({ userId }).select("integrations");

        if (!profile?.integrations?.google?.connected) {
            res.status(403).json({ success: false, message: "Google Calendar not connected" });
            return;
        }

        next();
    } catch {
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export const handleValidationErrors = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(422).json({ success: false, errors: errors.array() });
        return;
    }
    next();
};

export const validateCreateProfile = [
    body("username")
        .trim()
        .isLength({ min: 3, max: 30 })
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage("Username must be 3-30 characters, alphanumeric or underscore only"),
    body("fullName")
        .trim()
        .isLength({ min: 2, max: 80 })
        .withMessage("Full name must be 2-80 characters"),
    body("nickName").optional().trim().isLength({ max: 40 }),
    body("bio").optional().trim().isLength({ max: 300 }),
    handleValidationErrors,
];

export const validateUpdateProfile = [
    body("fullName").optional().trim().isLength({ min: 2, max: 80 }),
    body("nickName").optional().trim().isLength({ max: 40 }),
    body("bio").optional().trim().isLength({ max: 300 }),
    body("profilePicture").optional().isURL().withMessage("Profile picture must be a valid URL"),
    handleValidationErrors,
];

export const validateUpdateUsername = [
    body("username")
        .trim()
        .isLength({ min: 3, max: 30 })
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage("Username must be 3-30 characters, alphanumeric or underscore only"),
    handleValidationErrors,
];

export const validateLocation = [
    body("lat")
        .isFloat({ min: -90, max: 90 })
        .withMessage("Latitude must be between -90 and 90"),
    body("lng")
        .isFloat({ min: -180, max: 180 })
        .withMessage("Longitude must be between -180 and 180"),
    handleValidationErrors,
];

export const validateUsernameParam = [
    param("username")
        .trim()
        .isLength({ min: 3, max: 30 })
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage("Invalid username"),
    handleValidationErrors,
];