import { Router } from "express";
import passport from "../configs/passport.config";
import {
    oauthCallback,
    refreshAccessToken,
    logout,
    getMe,
} from "../controllers/user.controller";
import { authenticate } from "../middlewares/user.middleware";

const router = Router();

router.get("/google", passport.authenticate("google", { session: false }));

router.get(
    "/google/callback",
    passport.authenticate("google", { session: false, failureRedirect: "/api/auth/failure" }),
    oauthCallback
);

router.get("/github", passport.authenticate("github", { session: false }));

router.get(
    "/github/callback",
    passport.authenticate("github", { session: false, failureRedirect: "/api/auth/failure" }),
    oauthCallback
);

router.post("/refresh", refreshAccessToken);

router.post("/logout", logout);

router.get("/me", authenticate, getMe);

router.get("/failure", (_req, res) => {
    res.status(401).json({ success: false, message: "OAuth authentication failed" });
});

export default router;