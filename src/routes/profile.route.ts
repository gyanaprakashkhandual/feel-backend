import { Router } from "express";
import passport from "../configs/spotify.config";
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

router.get(
    "/spotify",
    authenticate,
    passport.authenticate("spotify", { session: false })
);

router.get(
    "/spotify/callback",
    authenticate,
    passport.authenticate("spotify", { session: false, failureRedirect: `${process.env.CLIENT_URL}/integrations?error=spotify` }),
    (_req, res) => {
        res.redirect(`${process.env.CLIENT_URL}/integrations?spotify=connected`);
    }
);

router.get("/spotify/data", authenticate, requireProfileOwner, getSpotifyData);
router.delete("/spotify", authenticate, requireProfileOwner, disconnectSpotify);

router.post("/google/calendar/connect", authenticate, requireProfileOwner, connectGoogleCalendar);
router.get("/google/calendar/events", authenticate, requireProfileOwner, getCalendarEvents);
router.delete("/google/calendar", authenticate, requireProfileOwner, disconnectGoogleCalendar);

// In your routes file
router.post("/google/calendar/exchange", authenticate, exchangeGoogleCode);

export default router;