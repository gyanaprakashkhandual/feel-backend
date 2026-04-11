import { Schema } from "mongoose";
import { IMoodDocument } from "../types/mood.types";

const moodFileSchema = new Schema(
    {
        url: { type: String, required: true },
        key: { type: String, required: true },
        mimeType: { type: String, required: true },
        size: { type: Number, required: true },
    },
    { _id: false }
);

const weatherSnapshotSchema = new Schema(
    {
        temperature: { type: Number, required: true },
        feelsLike: { type: Number, required: true },
        humidity: { type: Number, required: true },
        condition: { type: String, required: true },
        description: { type: String, required: true },
        windSpeed: { type: Number, required: true },
        icon: { type: String, required: true },
        city: { type: String, required: true },
        country: { type: String, required: true },
    },
    { _id: false }
);

const locationSnapshotSchema = new Schema(
    {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
        city: { type: String, default: null },
        country: { type: String, default: null },
        timezone: { type: String, required: true },
    },
    { _id: false }
);

const calendarEventSchema = new Schema(
    {
        id: { type: String, required: true },
        title: { type: String, required: true },
        description: { type: String, default: null },
        startTime: { type: Date, required: true },
        endTime: { type: Date, required: true },
        isAllDay: { type: Boolean, default: false },
        location: { type: String, default: null },
        status: {
            type: String,
            enum: ["confirmed", "tentative", "cancelled"],
            default: "confirmed",
        },
        organizer: { type: String, default: null },
    },
    { _id: false }
);

const calendarContextSchema = new Schema(
    {
        wholeDayEvents: { type: [calendarEventSchema], default: [] },
        windowEvents: { type: [calendarEventSchema], default: [] },
        windowStart: { type: Date, required: true },
        windowEnd: { type: Date, required: true },
    },
    { _id: false }
);

const spotifyTrackSchema = new Schema(
    {
        trackId: { type: String, required: true },
        trackName: { type: String, required: true },
        artistName: { type: String, required: true },
        albumName: { type: String, required: true },
        albumArt: { type: String, default: null },
        durationMs: { type: Number, required: true },
        playedAt: { type: Date, required: true },
        previewUrl: { type: String, default: null },
    },
    { _id: false }
);

const spotifyContextSchema = new Schema(
    {
        wholeDayTracks: { type: [spotifyTrackSchema], default: [] },
        windowTracks: { type: [spotifyTrackSchema], default: [] },
        windowStart: { type: Date, required: true },
        windowEnd: { type: Date, required: true },
        dominantGenres: { type: [String], default: [] },
    },
    { _id: false }
);

const todoSnapshotSchema = new Schema(
    {
        todoId: { type: Schema.Types.ObjectId, ref: "Todo", required: true },
        title: { type: String, required: true },
        priority: {
            type: String,
            enum: ["low", "medium", "high", "urgent"],
            required: true,
        },
        status: {
            type: String,
            enum: ["pending", "in_progress", "completed", "cancelled"],
            required: true,
        },
        dueDate: { type: Date, default: null },
        isOverdue: { type: Boolean, default: false },
        tags: { type: [String], default: [] },
    },
    { _id: false }
);

const todoContextSchema = new Schema(
    {
        wholeDayTodos: { type: [todoSnapshotSchema], default: [] },
        windowTodos: { type: [todoSnapshotSchema], default: [] },
        windowStart: { type: Date, required: true },
        windowEnd: { type: Date, required: true },
        overdueCount: { type: Number, default: 0 },
    },
    { _id: false }
);

const moodContextSchema = new Schema(
    {
        capturedAt: { type: Date, required: true },
        location: { type: locationSnapshotSchema, default: null },
        weather: { type: weatherSnapshotSchema, default: null },
        calendar: { type: calendarContextSchema, default: null },
        spotify: { type: spotifyContextSchema, default: null },
        todos: { type: todoContextSchema, default: null },
        userBio: { type: String, default: null },
    },
    { _id: false }
);

export const moodSchema = new Schema<IMoodDocument>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        emoji: {
            type: String,
            enum: [
                "😊", "😔", "😡", "😰", "😴", "🤩", "😌", "😢",
                "😤", "🥳", "😑", "🤯", "😇", "🥺", "😎", "🤒",
            ],
            default: null,
        },
        message: { type: String, trim: true, maxlength: 1000, default: null },
        files: { type: [moodFileSchema], default: [] },
        score: { type: Number, min: 1, max: 10, default: null },
        tags: { type: [String], default: [] },
        context: { type: moodContextSchema, required: true },
        isContextCaptured: { type: Boolean, default: false },
        contextCaptureErrors: { type: [String], default: [] },
    },
    {
        timestamps: true,
        toJSON: {
            transform: (_doc, ret) => {
                delete (ret as any).__v;
                return ret;
            },
        },
    }
);

moodSchema.index({ userId: 1, createdAt: -1 });
moodSchema.index({ userId: 1, emoji: 1 });
moodSchema.index({ userId: 1, score: 1 });
moodSchema.index({ userId: 1, tags: 1 });
moodSchema.index({ userId: 1, "context.capturedAt": -1 });
moodSchema.index({ userId: 1, isContextCaptured: 1 });