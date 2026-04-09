import passport from "passport";
import { Strategy as SpotifyStrategy, Profile as SpotifyProfile } from "passport-spotify";
import { VerifyCallback } from "passport-oauth2";
import Profile from "../models/profile.model";

const SPOTIFY_CALLBACK_URL = `${process.env.API_BASE_URL}/api/profile/spotify/callback`;

passport.use(
    new SpotifyStrategy(
        {
            clientID: process.env.SPOTIFY_CLIENT_ID!,
            clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
            callbackURL: SPOTIFY_CALLBACK_URL,
            scope: process.env.SPOTIFY_SCOPES?.split(" ") ?? [
                "user-read-email",
                "user-read-private",
                "playlist-read-private",
            ],
            passReqToCallback: true,
        },
        async (
            req: Express.Request,
            accessToken: string,
            refreshToken: string,
            _expires_in: number,
            profile: SpotifyProfile,
            done: VerifyCallback
        ) => {
            try {
                const userId = (req.user as any)?._id?.toString();

                if (!userId) {
                    return done(new Error("User not authenticated"));
                }

                const updated = await Profile.findOneAndUpdate(
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
                    { new: true, upsert: false }
                );

                if (!updated) {
                    return done(new Error("Profile not found"));
                }

                return done(null, req.user as Express.User);
            } catch (error) {
                return done(error as Error);
            }
        }
    )
);

export default passport;