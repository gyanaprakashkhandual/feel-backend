import { Request, Response } from "express";
import { google } from "googleapis";
import Profile from "../models/profile.model";
import { AuthRequest } from "../middlewares/user.middleware";

const getOAuth2Client = (accessToken: string, refreshToken?: string) => {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${process.env.API_BASE_URL}/api/profile/google/calendar/callback`
    );
    oauth2Client.setCredentials({ access_token: accessToken, refresh_token: refreshToken });
    return oauth2Client;
};

export const createProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as AuthRequest).user.userId;
        const { username, fullName, nickName, bio } = req.body;

        const existing = await Profile.findOne({ $or: [{ userId }, { username }] });

        if (existing) {
            res.status(409).json({ success: false, message: "Profile or username already exists" });
            return;
        }

        const profile = await Profile.create({ userId, username, fullName, nickName, bio });

        res.status(201).json({ success: true, profile });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getMyProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as AuthRequest).user.userId;
        const profile = await Profile.findOne({ userId });

        if (!profile) {
            res.status(404).json({ success: false, message: "Profile not found" });
            return;
        }

        res.status(200).json({ success: true, profile });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getProfileByUsername = async (req: Request, res: Response): Promise<void> => {
    try {
        const { username } = req.params;
        const profile = await Profile.findOne({ username: (req.params.username as string).toLowerCase() }).select("-integrations");

        if (!profile) {
            res.status(404).json({ success: false, message: "Profile not found" });
            return;
        }

        res.status(200).json({ success: true, profile });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as AuthRequest).user.userId;
        const { fullName, nickName, bio, profilePicture } = req.body;

        const profile = await Profile.findOneAndUpdate(
            { userId },
            { $set: { fullName, nickName, bio, profilePicture } },
            { new: true, runValidators: true }
        );

        if (!profile) {
            res.status(404).json({ success: false, message: "Profile not found" });
            return;
        }

        res.status(200).json({ success: true, profile });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateUsername = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as AuthRequest).user.userId;
        const { username } = req.body;

        const taken = await Profile.findOne({ username: username.toLowerCase(), userId: { $ne: userId } });

        if (taken) {
            res.status(409).json({ success: false, message: "Username already taken" });
            return;
        }

        const profile = await Profile.findOneAndUpdate(
            { userId },
            { $set: { username: username.toLowerCase() } },
            { new: true }
        );

        if (!profile) {
            res.status(404).json({ success: false, message: "Profile not found" });
            return;
        }

        res.status(200).json({ success: true, profile });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};


export const connectSpotify = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as AuthRequest).user.userId;
        const { accessToken, refreshToken } = req.body;

        const profile = await Profile.findOneAndUpdate(
            { userId },
            {
                $set: {
                    "integrations.spotify": {
                        accessToken,
                        refreshToken,
                        connected: true,
                    },
                },
            },
            { new: true }
        );

        if (!profile) {
            res.status(404).json({ success: false, message: "Profile not found" });
            return;
        }

        res.status(200).json({ success: true, message: "Spotify connected" });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const saveLocation = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as AuthRequest).user.userId;
        const { lat, lng } = req.body;

        if (typeof lat !== "number" || typeof lng !== "number") {
            res.status(400).json({ success: false, message: "Invalid coordinates" });
            return;
        }

        const profile = await Profile.findOneAndUpdate(
            { userId },
            { $set: { location: { lat, lng } } },
            { new: true }
        );

        if (!profile) {
            res.status(404).json({ success: false, message: "Profile not found" });
            return;
        }

        res.status(200).json({ success: true, location: profile.location });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};


export const spotifyCallback = async (req: Request, res: Response): Promise<void> => {
    try {
        // Passport already saved tokens, just redirect to frontend
        res.redirect(`${process.env.CLIENT_URL}/settings?spotify=connected`);
    } catch (error: any) {
        res.redirect(`${process.env.CLIENT_URL}/settings?spotify=error`);
    }
};

// Helper for Spotify token refresh
const refreshSpotifyToken = async (userId: string, refreshToken: string) => {
    const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${Buffer.from(
                `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
            ).toString("base64")}`,
        },
        body: new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: refreshToken,
        }),
    });
    
    const data = await response.json();
    
    await Profile.findOneAndUpdate(
        { userId },
        { $set: { "integrations.spotify.accessToken": data.access_token } }
    );
    
    return data.access_token;
};


export const getCalendarEvents = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as AuthRequest).user.userId;
        const profile = await Profile.findOne({ userId });

        if (!profile?.integrations?.google?.connected) {
            res.status(403).json({ success: false, message: "Google Calendar not connected" });
            return;
        }

        const { accessToken, refreshToken } = profile.integrations.google;
        const auth = getOAuth2Client(accessToken, refreshToken);

        auth.on("tokens", async (tokens) => {
            if (tokens.access_token) {
                await Profile.findOneAndUpdate(
                    { userId },
                    { $set: { "integrations.google.accessToken": tokens.access_token } }
                );
            }
        });

        const calendar = google.calendar({ version: "v3", auth });

        const { data } = await calendar.events.list({
            calendarId: "primary",
            timeMin: new Date().toISOString(),
            maxResults: 20,
            singleEvents: true,
            orderBy: "startTime",
        });

        res.status(200).json({ success: true, events: data.items });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const connectGoogleCalendar = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as AuthRequest).user.userId;
        const { accessToken, refreshToken } = req.body;

        const profile = await Profile.findOneAndUpdate(
            { userId },
            {
                $set: {
                    "integrations.google": {
                        accessToken,
                        refreshToken,
                        connected: true,
                    },
                },
            },
            { new: true }
        );

        if (!profile) {
            res.status(404).json({ success: false, message: "Profile not found" });
            return;
        }

        res.status(200).json({ success: true, message: "Google Calendar connected" });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const disconnectGoogleCalendar = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as AuthRequest).user.userId;

        await Profile.findOneAndUpdate(
            { userId },
            { $set: { "integrations.google": null } }
        );

        res.status(200).json({ success: true, message: "Google Calendar disconnected" });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getSpotifyData = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as AuthRequest).user.userId;
        const profile = await Profile.findOne({ userId });

        if (!profile?.integrations?.spotify?.connected) {
            res.status(403).json({ success: false, message: "Spotify not connected" });
            return;
        }

        const { accessToken } = profile.integrations.spotify;

        const playlistsRes = await fetch("https://api.spotify.com/v1/me/playlists?limit=20", {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!playlistsRes.ok) {
            res.status(502).json({ success: false, message: "Failed to fetch Spotify data" });
            return;
        }

        const playlists = await playlistsRes.json();

        res.status(200).json({ success: true, playlists: playlists.items });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const disconnectSpotify = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as AuthRequest).user.userId;

        await Profile.findOneAndUpdate(
            { userId },
            { $set: { "integrations.spotify": null } }
        );

        res.status(200).json({ success: true, message: "Spotify disconnected" });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getIntegrationStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as AuthRequest).user.userId;
        const profile = await Profile.findOne({ userId }).select("integrations");

        if (!profile) {
            res.status(404).json({ success: false, message: "Profile not found" });
            return;
        }

        res.status(200).json({
            success: true,
            integrations: {
                google: { connected: profile.integrations?.google?.connected ?? false },
                spotify: { connected: profile.integrations?.spotify?.connected ?? false },
            },
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as AuthRequest).user.userId;
        await Profile.findOneAndDelete({ userId });
        res.status(200).json({ success: true, message: "Profile deleted" });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};


export const exchangeGoogleCode = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as AuthRequest).user.userId;
        const { code } = req.body;

        if (!code) {
            res.status(400).json({ success: false, message: "Authorization code required" });
            return;
        }

        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            `${process.env.CLIENT_URL}/calendar/callback`
        );

        const { tokens } = await oauth2Client.getToken(code);

        // First, ensure integrations exists
        await Profile.updateOne(
            { userId },
            { $set: { integrations: {} } },
            { upsert: false }
        );

        // Then set the google integration
        const profile = await Profile.findOneAndUpdate(
            { userId },
            {
                $set: {
                    "integrations.google": {
                        accessToken: tokens.access_token,
                        refreshToken: tokens.refresh_token,
                        connected: true,
                    }
                }
            },
            { new: true }
        );

        if (!profile) {
            res.status(404).json({ success: false, message: "Profile not found" });
            return;
        }

        res.status(200).json({ success: true, message: "Google Calendar connected" });
    } catch (error: any) {
        console.error("Token exchange error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const exchangeSpotifyCode = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as AuthRequest).user.userId;
        const { code } = req.body;

        console.log("🔄 Exchanging Spotify code for user:", userId);

        if (!code) {
            res.status(400).json({ success: false, message: "Authorization code required" });
            return;
        }

        // Exchange code with Spotify
        const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: `Basic ${Buffer.from(
                    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
                ).toString("base64")}`,
            },
            body: new URLSearchParams({
                grant_type: "authorization_code",
                code,
                redirect_uri: process.env.SPOTIFY_CALLBACK_URL!,
            }),
        });

        if (!tokenResponse.ok) {
            const error = await tokenResponse.text();
            console.error("❌ Spotify token exchange failed:", error);
            res.status(400).json({ success: false, message: "Failed to exchange code" });
            return;
        }

        const tokens = await tokenResponse.json();
        console.log("✅ Tokens received from Spotify");

        // Save tokens to profile
        const profile = await Profile.findOneAndUpdate(
            { userId },
            {
                $set: {
                    "integrations.spotify": {
                        accessToken: tokens.access_token,
                        refreshToken: tokens.refresh_token,
                        connected: true,
                    },
                },
            },
            { new: true }
        );

        if (!profile) {
            res.status(404).json({ success: false, message: "Profile not found" });
            return;
        }

        console.log("✅ Spotify tokens saved to profile");
        res.status(200).json({ 
            success: true, 
            message: "Spotify connected successfully" 
        });
    } catch (error: any) {
        console.error("❌ Spotify exchange error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};