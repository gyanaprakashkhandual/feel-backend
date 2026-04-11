import { Types } from "mongoose";
import { Request, Response } from "express";
import { Mood } from "../../models/mood.model";
import { IMoodContext } from "../../types/mood.types";
import { resolveLocation } from "./location.service";
import { getWeatherByCoords } from "./weather.service";
import { getCalendarContext } from "./calendar.service";
import { getSpotifyContext } from "./spotify.service";
import { getTodoContext } from "./todo.service";
import {
    getProfileContextData,
    updateGoogleAccessToken,
    updateSpotifyAccessToken,
} from "./profile.service";

export interface IContextCaptureResult {
    context: IMoodContext;
    isContextCaptured: boolean;
    contextCaptureErrors: string[];
}

export const captureContext = async (
    userId: Types.ObjectId,
    timestamp: Date
): Promise<IContextCaptureResult> => {
    const profileData = await getProfileContextData(userId);

    const [locationResult, calendarResult, spotifyResult, todoResult] = await Promise.allSettled([
        profileData.location
            ? resolveLocation(profileData.location.lat, profileData.location.lng)
            : Promise.reject(new Error("no_location")),

        profileData.isGoogleConnected &&
            profileData.googleAccessToken &&
            profileData.googleRefreshToken
            ? getCalendarContext(
                profileData.googleAccessToken,
                profileData.googleRefreshToken,
                timestamp,
                (newToken) => updateGoogleAccessToken(userId, newToken)
            )
            : Promise.reject(new Error("google_not_connected")),

        profileData.isSpotifyConnected &&
            profileData.spotifyAccessToken &&
            profileData.spotifyRefreshToken
            ? getSpotifyContext(
                profileData.spotifyAccessToken,
                profileData.spotifyRefreshToken,
                timestamp,
                (newToken) => updateSpotifyAccessToken(userId, newToken)
            )
            : Promise.reject(new Error("spotify_not_connected")),

        getTodoContext(userId, timestamp),
    ]);

    const weatherResult =
        locationResult.status === "fulfilled"
            ? await Promise.allSettled([
                getWeatherByCoords(locationResult.value.lat, locationResult.value.lng),
            ]).then(([r]) => r)
            : { status: "rejected" as const, reason: new Error("location_unavailable") };

    const errors: string[] = [];

    const location =
        locationResult.status === "fulfilled" ? locationResult.value : (errors.push("location"), null);

    const weather =
        weatherResult.status === "fulfilled" ? weatherResult.value : (errors.push("weather"), null);

    const calendar =
        calendarResult.status === "fulfilled"
            ? calendarResult.value
            : (errors.push("calendar"), null);

    const spotify =
        spotifyResult.status === "fulfilled" ? spotifyResult.value : (errors.push("spotify"), null);

    const todos =
        todoResult.status === "fulfilled" ? todoResult.value : (errors.push("todos"), null);

    console.log("=== CONTEXT CAPTURE DEBUG ===");
    console.log("Location:", JSON.stringify(location, null, 2));
    console.log("Weather:", JSON.stringify(weather, null, 2));
    console.log("Calendar:", JSON.stringify(calendar, null, 2));
    console.log("Spotify:", JSON.stringify(spotify, null, 2));
    console.log("Todos:", JSON.stringify(todos, null, 2));
    console.log("ProfileData:", JSON.stringify(profileData, null, 2));
    console.log("============================");

    const context: IMoodContext = {
        capturedAt: timestamp,
        location,
        weather,
        calendar,
        spotify,
        todos,
        userBio: profileData.bio,
    };

    const isContextCaptured = errors.length === 0;

    return { context, isContextCaptured, contextCaptureErrors: errors };
};

export const retryMoodContext = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req.user as { _id: Types.ObjectId })._id;
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

        // ✅ Safe timestamp handling
        const captureTimestamp = existing.context?.capturedAt || new Date();

        const { context, isContextCaptured, contextCaptureErrors } = await captureContext(
            userId,
            captureTimestamp
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