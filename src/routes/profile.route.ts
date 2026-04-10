import { Router } from "express";
import { authenticate } from "../middlewares/user.middleware";
import {
    createProfile,
    getMyProfile,
    getProfileByUsername,
    updateProfile,
    updateUsername,
    saveLocation,
    getCalendarEvents,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
    getSpotifyData,
    disconnectSpotify,
    getIntegrationStatus,
    deleteProfile,
    exchangeGoogleCode,
    exchangeSpotifyCode,
} from "../controllers/profile.controller";
import {
    requireProfileOwner,
    requireNoProfile,
    validateCreateProfile,
    validateUpdateProfile,
    validateUpdateUsername,
    validateLocation,
    validateUsernameParam,
} from "../middlewares/profile.middleware";

const router = Router();

router.post("/", authenticate, requireNoProfile, validateCreateProfile, createProfile);
router.get("/me", authenticate, getMyProfile);
router.put("/me", authenticate, requireProfileOwner, validateUpdateProfile, updateProfile);
router.patch("/me/username", authenticate, requireProfileOwner, validateUpdateUsername, updateUsername);
router.delete("/me", authenticate, requireProfileOwner, deleteProfile);

router.get("/u/:username", validateUsernameParam, getProfileByUsername);
router.post("/me/location", authenticate, requireProfileOwner, validateLocation, saveLocation);

router.get("/integrations/status", authenticate, requireProfileOwner, getIntegrationStatus);

router.get("/spotify/data", authenticate, requireProfileOwner, getSpotifyData);
router.delete("/spotify", authenticate, requireProfileOwner, disconnectSpotify);

// ── Spotify OAuth callback (no auth — Spotify redirects here directly) ──
router.get("/spotify/callback", async (req, res) => {
    try {
        const { code, state, error } = req.query;

        if (error) {
            return res.redirect(`${process.env.CLIENT_URL}/spotify/callback?error=spotify_denied`);
        }

        if (!code || !state) {
            return res.redirect(`${process.env.CLIENT_URL}/spotify/callback?error=missing_params`);
        }

        const userId = state as string;

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
                code: code as string,
                redirect_uri: process.env.SPOTIFY_REDIRECT_URI!,
            }),
        });

        if (!tokenResponse.ok) {
            return res.redirect(`${process.env.CLIENT_URL}/spotify/callback?error=token_exchange_failed`);
        }

        const tokens = await tokenResponse.json();

        const Profile = (await import("../models/profile.model")).default;

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
            return res.redirect(`${process.env.CLIENT_URL}/spotify/callback?error=profile_not_found`);
        }

        return res.redirect(`${process.env.CLIENT_URL}/spotify/callback?success=true`);
    } catch (err) {
        console.error("Spotify callback error:", err);
        return res.redirect(`${process.env.CLIENT_URL}/spotify/callback?error=spotify_failed`);
    }
});

// ── Spotify exchange (authenticated — fallback if using frontend-side flow) ──
router.post("/spotify/exchange", authenticate, requireProfileOwner, exchangeSpotifyCode);

router.post("/google/calendar/connect", authenticate, requireProfileOwner, connectGoogleCalendar);
router.get("/google/calendar/events", authenticate, requireProfileOwner, getCalendarEvents);
router.delete("/google/calendar", authenticate, requireProfileOwner, disconnectGoogleCalendar);
router.post("/google/calendar/exchange", authenticate, exchangeGoogleCode);

export default router;