import axios from "axios";
import { ISpotifyContext, ISpotifyTrack } from "../../types/mood.types";

const SPOTIFY_BASE_URL = "https://api.spotify.com/v1";
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_WINDOW_HOURS = 2;
const SPOTIFY_MAX_HISTORY_LIMIT = 50;

interface ISpotifyTrackItem {
    track: {
        id: string;
        name: string;
        duration_ms: number;
        preview_url: string | null;
        artists: Array<{ name: string }>;
        album: {
            name: string;
            images: Array<{ url: string }>;
        };
    };
    played_at: string;
}

interface ISpotifyRecentlyPlayedResponse {
    items: ISpotifyTrackItem[];
}

interface ISpotifyArtistResponse {
    genres: string[];
}

interface ISpotifyTokenResponse {
    access_token: string;
}

const refreshSpotifyAccessToken = async (refreshToken: string): Promise<string> => {
    const credentials = Buffer.from(
        `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
    ).toString("base64");

    const response = await axios.post<ISpotifyTokenResponse>(
        SPOTIFY_TOKEN_URL,
        new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }),
        {
            headers: {
                Authorization: `Basic ${credentials}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            timeout: 5000,
        }
    );

    return response.data.access_token;
};

const mapSpotifyItemToTrack = (item: ISpotifyTrackItem): ISpotifyTrack => ({
    trackId: item.track.id,
    trackName: item.track.name,
    artistName: item.track.artists.map((a) => a.name).join(", "),
    albumName: item.track.album.name,
    albumArt: item.track.album.images[0]?.url ?? null,
    durationMs: item.track.duration_ms,
    playedAt: new Date(item.played_at),
    previewUrl: item.track.preview_url,
});

const fetchRecentlyPlayed = async (
    accessToken: string,
    before: number,
    after: number
): Promise<ISpotifyTrackItem[]> => {
    const response = await axios.get<ISpotifyRecentlyPlayedResponse>(
        `${SPOTIFY_BASE_URL}/me/player/recently-played`,
        {
            headers: { Authorization: `Bearer ${accessToken}` },
            params: { limit: SPOTIFY_MAX_HISTORY_LIMIT, before, after },
            timeout: 8000,
        }
    );

    return response.data.items ?? [];
};

const fetchDominantGenres = async (
    accessToken: string,
    artistNames: string[]
): Promise<string[]> => {
    if (artistNames.length === 0) return [];

    const uniqueArtists = [...new Set(artistNames)].slice(0, 5);

    const searchResults = await Promise.allSettled(
        uniqueArtists.map((name) =>
            axios.get<{ artists: { items: Array<{ id: string }> } }>(
                `${SPOTIFY_BASE_URL}/search`,
                {
                    headers: { Authorization: `Bearer ${accessToken}` },
                    params: { q: name, type: "artist", limit: 1 },
                    timeout: 5000,
                }
            )
        )
    );

    const artistIds = searchResults
        .filter((r) => r.status === "fulfilled")
        .map((r) => (r as PromiseFulfilledResult<any>).value.data.artists.items[0]?.id)
        .filter(Boolean);

    if (artistIds.length === 0) return [];

    const artistResponse = await axios.get<{ artists: ISpotifyArtistResponse[] }>(
        `${SPOTIFY_BASE_URL}/artists`,
        {
            headers: { Authorization: `Bearer ${accessToken}` },
            params: { ids: artistIds.join(",") },
            timeout: 5000,
        }
    );

    const genreCount: Record<string, number> = {};

    for (const artist of artistResponse.data.artists) {
        for (const genre of artist.genres) {
            genreCount[genre] = (genreCount[genre] ?? 0) + 1;
        }
    }

    return Object.entries(genreCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([genre]) => genre);
};

export const getSpotifyContext = async (
    accessToken: string,
    refreshToken: string,
    timestamp: Date,
    onTokenRefresh: (newToken: string) => Promise<void>
): Promise<ISpotifyContext> => {
    let token = accessToken;

    const dayStart = new Date(timestamp);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(timestamp);
    dayEnd.setHours(23, 59, 59, 999);

    const windowStart = new Date(timestamp.getTime() - SPOTIFY_WINDOW_HOURS * 60 * 60 * 1000);
    const windowEnd = new Date(timestamp.getTime() + SPOTIFY_WINDOW_HOURS * 60 * 60 * 1000);

    let rawItems: ISpotifyTrackItem[];

    try {
        rawItems = await fetchRecentlyPlayed(token, dayEnd.getTime(), dayStart.getTime());
    } catch (error: any) {
        if (error?.response?.status === 401) {
            token = await refreshSpotifyAccessToken(refreshToken);
            await onTokenRefresh(token);
            rawItems = await fetchRecentlyPlayed(token, dayEnd.getTime(), dayStart.getTime());
        } else {
            throw error;
        }
    }

    const wholeDayTracks = rawItems.map(mapSpotifyItemToTrack);

    const windowTracks = wholeDayTracks.filter(
        (track) => track.playedAt >= windowStart && track.playedAt <= windowEnd
    );

    const artistNames = wholeDayTracks.map((t) => t.artistName);
    const dominantGenres = await fetchDominantGenres(token, artistNames).catch(() => []);

    return { wholeDayTracks, windowTracks, windowStart, windowEnd, dominantGenres };
};