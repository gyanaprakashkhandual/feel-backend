import { Types } from "mongoose";
import Profile from "../../models/profile.model";

export interface IProfileContextData {
    bio: string | null;
    location: { lat: number; lng: number } | null;
    googleAccessToken: string | null;
    googleRefreshToken: string | null;
    spotifyAccessToken: string | null;
    spotifyRefreshToken: string | null;
    isGoogleConnected: boolean;
    isSpotifyConnected: boolean;
}

export const getProfileContextData = async (userId: Types.ObjectId): Promise<IProfileContextData> => {
    if (!userId) {
        console.error("❌ userId is undefined in getProfileContextData");
        return {
            bio: null,
            location: null,
            googleAccessToken: null,
            googleRefreshToken: null,
            spotifyAccessToken: null,
            spotifyRefreshToken: null,
            isGoogleConnected: false,
            isSpotifyConnected: false,
        };
    }

    const profile = await Profile.findOne({ userId: userId.toString() })
        .select("bio location integrations")
        .lean();

    if (!profile) {
        return {
            bio: null,
            location: null,
            googleAccessToken: null,
            googleRefreshToken: null,
            spotifyAccessToken: null,
            spotifyRefreshToken: null,
            isGoogleConnected: false,
            isSpotifyConnected: false,
        };
    }

    const google = profile.integrations?.google ?? null;
    const spotify = profile.integrations?.spotify ?? null;

    return {
        bio: profile.bio ?? null,
        location: profile.location ?? null,
        googleAccessToken: google?.accessToken ?? null,
        googleRefreshToken: google?.refreshToken ?? null,
        spotifyAccessToken: spotify?.accessToken ?? null,
        spotifyRefreshToken: spotify?.refreshToken ?? null,
        isGoogleConnected: google?.connected === true,
        isSpotifyConnected: spotify?.connected === true,
    };
};

export const updateGoogleAccessToken = async (
    userId: Types.ObjectId,
    newAccessToken: string
): Promise<void> => {
    await Profile.updateOne(
        { userId: userId.toString() },
        { $set: { "integrations.google.accessToken": newAccessToken } }
    );
};

export const updateSpotifyAccessToken = async (
    userId: Types.ObjectId,
    newAccessToken: string
): Promise<void> => {
    await Profile.updateOne(
        { userId: userId.toString() },
        { $set: { "integrations.spotify.accessToken": newAccessToken } }
    );
};