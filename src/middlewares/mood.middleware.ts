import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";

const VALID_EMOJIS = [
    "😊", "😔", "😡", "😰", "😴", "🤩", "😌", "😢",
    "😤", "🥳", "😑", "🤯", "😇", "🥺", "😎", "🤒",
] as const;

const VALID_MIME_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "video/mp4",
    "video/quicktime",
    "audio/mpeg",
    "audio/wav",
    "application/pdf",
];

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;
const MAX_FILES = 5;
const MAX_MESSAGE_LENGTH = 1000;
const MAX_TAGS = 10;
const MAX_TAG_LENGTH = 30;

export const validateCreateMood = (req: Request, res: Response, next: NextFunction): void => {
    const { emoji, message, files, score, tags } = req.body;

    if (!emoji && !message && (!files || files.length === 0)) {
        res.status(400).json({
            success: false,
            message: "At least one of emoji, message, or files is required.",
        });
        return;
    }

    if (emoji !== undefined) {
        if (typeof emoji !== "string" || !VALID_EMOJIS.includes(emoji as any)) {
            res.status(400).json({
                success: false,
                message: "Invalid emoji value.",
            });
            return;
        }
    }

    if (message !== undefined) {
        if (typeof message !== "string" || message.trim().length === 0) {
            res.status(400).json({
                success: false,
                message: "Message must be a non-empty string.",
            });
            return;
        }

        if (message.length > MAX_MESSAGE_LENGTH) {
            res.status(400).json({
                success: false,
                message: `Message cannot exceed ${MAX_MESSAGE_LENGTH} characters.`,
            });
            return;
        }
    }

    if (files !== undefined) {
        if (!Array.isArray(files)) {
            res.status(400).json({ success: false, message: "Files must be an array." });
            return;
        }

        if (files.length > MAX_FILES) {
            res.status(400).json({
                success: false,
                message: `Cannot upload more than ${MAX_FILES} files.`,
            });
            return;
        }

        for (const file of files) {
            if (
                typeof file.url !== "string" ||
                typeof file.key !== "string" ||
                typeof file.mimeType !== "string" ||
                typeof file.size !== "number"
            ) {
                res.status(400).json({
                    success: false,
                    message: "Each file must have url, key, mimeType, and size.",
                });
                return;
            }

            if (!VALID_MIME_TYPES.includes(file.mimeType)) {
                res.status(400).json({
                    success: false,
                    message: `Unsupported file type: ${file.mimeType}.`,
                });
                return;
            }

            if (file.size > MAX_FILE_SIZE_BYTES) {
                res.status(400).json({
                    success: false,
                    message: `File size cannot exceed ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB.`,
                });
                return;
            }
        }
    }

    if (score !== undefined) {
        const parsed = Number(score);
        if (!Number.isInteger(parsed) || parsed < 1 || parsed > 10) {
            res.status(400).json({
                success: false,
                message: "Score must be an integer between 1 and 10.",
            });
            return;
        }
    }

    if (tags !== undefined) {
        if (!Array.isArray(tags)) {
            res.status(400).json({ success: false, message: "Tags must be an array." });
            return;
        }

        if (tags.length > MAX_TAGS) {
            res.status(400).json({
                success: false,
                message: `Cannot have more than ${MAX_TAGS} tags.`,
            });
            return;
        }

        for (const tag of tags) {
            if (typeof tag !== "string" || tag.trim().length === 0) {
                res.status(400).json({
                    success: false,
                    message: "Each tag must be a non-empty string.",
                });
                return;
            }

            if (tag.length > MAX_TAG_LENGTH) {
                res.status(400).json({
                    success: false,
                    message: `Each tag cannot exceed ${MAX_TAG_LENGTH} characters.`,
                });
                return;
            }
        }
    }

    next();
};
/*
export const validateMoodId = (req: Request, res: Response, next: NextFunction): void => {
    const { id } = req.params;

    if (!id || !Types.ObjectId.isValid(id)) {
        res.status(400).json({ success: false, message: "Invalid mood ID." });
        return;
    }

    next();
};
*/
export const validateGetMoodsQuery = (req: Request, res: Response, next: NextFunction): void => {
    const { page, limit, emoji, score, startDate, endDate, tags } = req.query;

    if (page !== undefined) {
        const parsed = Number(page);
        if (!Number.isInteger(parsed) || parsed < 1) {
            res.status(400).json({ success: false, message: "Page must be a positive integer." });
            return;
        }
    }

    if (limit !== undefined) {
        const parsed = Number(limit);
        if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100) {
            res.status(400).json({
                success: false,
                message: "Limit must be an integer between 1 and 100.",
            });
            return;
        }
    }

    if (emoji !== undefined && !VALID_EMOJIS.includes(emoji as any)) {
        res.status(400).json({ success: false, message: "Invalid emoji filter value." });
        return;
    }

    if (score !== undefined) {
        const parsed = Number(score);
        if (!Number.isInteger(parsed) || parsed < 1 || parsed > 10) {
            res.status(400).json({
                success: false,
                message: "Score filter must be an integer between 1 and 10.",
            });
            return;
        }
    }

    if (startDate !== undefined && isNaN(Date.parse(startDate as string))) {
        res.status(400).json({ success: false, message: "Invalid startDate format." });
        return;
    }

    if (endDate !== undefined && isNaN(Date.parse(endDate as string))) {
        res.status(400).json({ success: false, message: "Invalid endDate format." });
        return;
    }

    if (
        startDate !== undefined &&
        endDate !== undefined &&
        new Date(startDate as string) > new Date(endDate as string)
    ) {
        res.status(400).json({
            success: false,
            message: "startDate cannot be after endDate.",
        });
        return;
    }

    if (tags !== undefined) {
        const tagList = (tags as string).split(",").map((t) => t.trim());
        if (tagList.some((t) => t.length === 0)) {
            res.status(400).json({ success: false, message: "Tags filter contains empty values." });
            return;
        }
    }

    next();
};