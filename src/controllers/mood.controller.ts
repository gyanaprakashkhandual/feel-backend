import { Request, Response } from "express";
import { Types } from "mongoose";
import { Mood } from "../models/mood.model";
import { captureContext } from "../service/collect-data/context.service";
import { ICreateMoodPayload, MoodEmoji, MoodScore } from "../types/mood.types";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

export const createMood = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user!._id as Types.ObjectId;
        const timestamp = new Date();

        const payload: ICreateMoodPayload = {
            emoji: req.body.emoji,
            message: req.body.message?.trim(),
            files: req.body.files ?? [],
            score: req.body.score ? Number(req.body.score) as MoodScore : undefined,
            tags: req.body.tags
                ? (req.body.tags as string[]).map((t) => t.trim().toLowerCase())
                : [],
        };

        const { context, isContextCaptured, contextCaptureErrors } = await captureContext(
            userId,
            timestamp
        );

        const mood = await Mood.create({
            userId,
            emoji: payload.emoji ?? null,
            message: payload.message ?? null,
            files: payload.files ?? [],
            score: payload.score ?? null,
            tags: payload.tags ?? [],
            context,
            isContextCaptured,
            contextCaptureErrors,
        });

        res.status(201).json({
            success: true,
            message: "Mood logged successfully.",
            data: mood.toJSON(),
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to log mood.",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

export const getMoods = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user!._id as Types.ObjectId;

        const page = Number(req.query.page ?? DEFAULT_PAGE);
        const limit = Number(req.query.limit ?? DEFAULT_LIMIT);
        const skip = (page - 1) * limit;

        const filter: Record<string, any> = { userId };

        if (req.query.emoji) {
            filter.emoji = req.query.emoji as MoodEmoji;
        }

        if (req.query.score) {
            filter.score = Number(req.query.score);
        }

        if (req.query.tags) {
            const tagList = (req.query.tags as string).split(",").map((t) => t.trim().toLowerCase());
            filter.tags = { $in: tagList };
        }

        if (req.query.startDate || req.query.endDate) {
            filter.createdAt = {};
            if (req.query.startDate) {
                filter.createdAt.$gte = new Date(req.query.startDate as string);
            }
            if (req.query.endDate) {
                const end = new Date(req.query.endDate as string);
                end.setHours(23, 59, 59, 999);
                filter.createdAt.$lte = end;
            }
        }

        const [moods, total] = await Promise.all([
            Mood.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Mood.countDocuments(filter),
        ]);

        res.status(200).json({
            success: true,
            data: moods,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasNextPage: page * limit < total,
                hasPrevPage: page > 1,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch moods.",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

export const getMoodById = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user!._id as Types.ObjectId;
        const { id } = req.params;

        const mood = await Mood.findOne({ _id: id, userId }).lean();

        if (!mood) {
            res.status(404).json({ success: false, message: "Mood not found." });
            return;
        }

        res.status(200).json({ success: true, data: mood });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch mood.",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

export const updateMood = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user!._id as Types.ObjectId;
        const { id } = req.params;

        const allowedUpdates: Partial<ICreateMoodPayload> = {};

        if (req.body.emoji !== undefined) allowedUpdates.emoji = req.body.emoji;
        if (req.body.message !== undefined) allowedUpdates.message = req.body.message.trim();
        if (req.body.score !== undefined) allowedUpdates.score = Number(req.body.score) as MoodScore;
        if (req.body.tags !== undefined) {
            allowedUpdates.tags = (req.body.tags as string[]).map((t) => t.trim().toLowerCase());
        }

        const mood = await Mood.findOneAndUpdate(
            { _id: id, userId },
            { $set: allowedUpdates },
            { new: true, runValidators: true }
        ).lean();

        if (!mood) {
            res.status(404).json({ success: false, message: "Mood not found." });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Mood updated successfully.",
            data: mood,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to update mood.",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

export const deleteMood = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user!._id as Types.ObjectId;
        const { id } = req.params;

        const mood = await Mood.findOneAndDelete({ _id: id, userId });

        if (!mood) {
            res.status(404).json({ success: false, message: "Mood not found." });
            return;
        }

        res.status(200).json({ success: true, message: "Mood deleted successfully." });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to delete mood.",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

export const getMoodStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user!._id as Types.ObjectId;

        const dateFilter: Record<string, any> = {};
        if (req.query.startDate || req.query.endDate) {
            dateFilter.createdAt = {};
            if (req.query.startDate) {
                dateFilter.createdAt.$gte = new Date(req.query.startDate as string);
            }
            if (req.query.endDate) {
                const end = new Date(req.query.endDate as string);
                end.setHours(23, 59, 59, 999);
                dateFilter.createdAt.$lte = end;
            }
        }

        const [emojiBreakdown, scoreStats, tagBreakdown, totalCount, contextFailures] =
            await Promise.all([
                Mood.aggregate([
                    { $match: { userId, ...dateFilter } },
                    { $group: { _id: "$emoji", count: { $sum: 1 } } },
                    { $sort: { count: -1 } },
                ]),

                Mood.aggregate([
                    { $match: { userId, score: { $ne: null }, ...dateFilter } },
                    {
                        $group: {
                            _id: null,
                            avg: { $avg: "$score" },
                            min: { $min: "$score" },
                            max: { $max: "$score" },
                        },
                    },
                ]),

                Mood.aggregate([
                    { $match: { userId, ...dateFilter } },
                    { $unwind: "$tags" },
                    { $group: { _id: "$tags", count: { $sum: 1 } } },
                    { $sort: { count: -1 } },
                    { $limit: 10 },
                ]),

                Mood.countDocuments({ userId, ...dateFilter }),

                Mood.countDocuments({ userId, isContextCaptured: false, ...dateFilter }),
            ]);

        res.status(200).json({
            success: true,
            data: {
                total: totalCount,
                contextFailures,
                emojiBreakdown: emojiBreakdown.map((e) => ({
                    emoji: e._id,
                    count: e.count,
                })),
                scoreStats: scoreStats[0]
                    ? {
                        average: Math.round(scoreStats[0].avg * 10) / 10,
                        min: scoreStats[0].min,
                        max: scoreStats[0].max,
                    }
                    : null,
                topTags: tagBreakdown.map((t) => ({ tag: t._id, count: t.count })),
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch mood stats.",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

export const getMoodContext = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user!._id as Types.ObjectId;
        const { id } = req.params;

        const mood = await Mood.findOne({ _id: id, userId })
            .select("context isContextCaptured contextCaptureErrors createdAt")
            .lean();

        if (!mood) {
            res.status(404).json({ success: false, message: "Mood not found." });
            return;
        }

        res.status(200).json({ success: true, data: mood });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch mood context.",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

export const retryMoodContext = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user!._id as Types.ObjectId;
        const { id } = req.params;

        const existing = await Mood.findOne({ _id: id, userId });

        if (!existing) {
            res.status(404).json({ success: false, message: "Mood not found." });
            return;
        }

        if (existing.isContextCaptured) {
            res.status(400).json({
                success: false,
                message: "Context already fully captured for this mood.",
            });
            return;
        }

        const { context, isContextCaptured, contextCaptureErrors } = await captureContext(
            userId,
            existing.context.capturedAt
        );

        const updated = await Mood.findByIdAndUpdate(
            id,
            { $set: { context, isContextCaptured, contextCaptureErrors } },
            { new: true }
        ).lean();

        res.status(200).json({
            success: true,
            message: "Context retry completed.",
            data: updated,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to retry context capture.",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};