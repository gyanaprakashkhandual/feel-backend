import { Document, Types } from "mongoose";

export type MoodEmoji =
    | "😊" | "😔" | "😡" | "😰" | "😴" | "🤩" | "😌" | "😢"
    | "😤" | "🥳" | "😑" | "🤯" | "😇" | "🥺" | "😎" | "🤒";

export type MoodScore = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface IMoodFile {
    url: string;
    key: string;
    mimeType: string;
    size: number;
}

export interface IWeatherSnapshot {
    temperature: number;
    feelsLike: number;
    humidity: number;
    condition: string;
    description: string;
    windSpeed: number;
    icon: string;
    city: string;
    country: string;
}

export interface ILocationSnapshot {
    lat: number;
    lng: number;
    city: string | null;
    country: string | null;
    timezone: string;
}

export interface ICalendarEvent {
    id: string;
    title: string;
    description: string | null;
    startTime: Date;
    endTime: Date;
    isAllDay: boolean;
    location: string | null;
    status: "confirmed" | "tentative" | "cancelled";
    organizer: string | null;
}

export interface ICalendarContext {
    wholeDayEvents: ICalendarEvent[];
    windowEvents: ICalendarEvent[];
    windowStart: Date;
    windowEnd: Date;
}

export interface ISpotifyTrack {
    trackId: string;
    trackName: string;
    artistName: string;
    albumName: string;
    albumArt: string | null;
    durationMs: number;
    playedAt: Date;
    previewUrl: string | null;
}

export interface ISpotifyContext {
    wholeDayTracks: ISpotifyTrack[];
    windowTracks: ISpotifyTrack[];
    windowStart: Date;
    windowEnd: Date;
    dominantGenres: string[];
}

export interface ITodoSnapshot {
    todoId: Types.ObjectId;
    title: string;
    priority: "low" | "medium" | "high" | "urgent";
    status: "pending" | "in_progress" | "completed" | "cancelled";
    dueDate: Date | null;
    isOverdue: boolean;
    tags: string[];
}

export interface ITodoContext {
    wholeDayTodos: ITodoSnapshot[];
    windowTodos: ITodoSnapshot[];
    windowStart: Date;
    windowEnd: Date;
    overdueCount: number;
}

export interface IMoodContext {
    capturedAt: Date;
    location: ILocationSnapshot | null;
    weather: IWeatherSnapshot | null;
    calendar: ICalendarContext | null;
    spotify: ISpotifyContext | null;
    todos: ITodoContext | null;
    userBio: string | null;
}

export interface IMood {
    userId: Types.ObjectId;
    emoji: MoodEmoji | null;
    message: string | null;
    files: IMoodFile[];
    score: MoodScore | null;
    tags: string[];
    context: IMoodContext;
    isContextCaptured: boolean;
    contextCaptureErrors: string[];
    createdAt: Date;
    updatedAt: Date;
}

export interface IMoodDocument extends IMood, Document { }

export interface ICreateMoodPayload {
    emoji?: MoodEmoji;
    message?: string;
    files?: IMoodFile[];
    score?: MoodScore;
    tags?: string[];
}