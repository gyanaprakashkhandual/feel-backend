import { Types } from "mongoose";
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