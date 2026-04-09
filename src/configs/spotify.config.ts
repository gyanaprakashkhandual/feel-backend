import passport from "passport";
import { Strategy as SpotifyStrategy, Profile as SpotifyProfile } from "passport-spotify";
import { IUserDocument } from "../models/user.model";
import Profile from "../models/profile.model";

const SPOTIFY_CALLBACK_URL = `${process.env.API_BASE_URL}/api/profile/spotify/callback`;

type SpotifyDone = (error: Error | null, user?: Express.User | false) => void;

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
            _profile: SpotifyProfile,
            done: SpotifyDone
        ) => {
            try {
                const user = req.user as IUserDocument | undefined;

                if (!user || !user._id) {
                    return done(new Error("User not authenticated"));
                }

                const userId = user._id.toString();

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

                return done(null, user);
            } catch (error) {
                return done(error instanceof Error ? error : new Error(String(error)));
            }
        }
    )
);

export default passport;