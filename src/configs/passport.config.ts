import passport from "passport";
import { Strategy as GoogleStrategy, Profile as GoogleProfile } from "passport-google-oauth20";
import { Strategy as GitHubStrategy, Profile as GitHubProfile } from "passport-github2";
import { VerifyCallback } from "passport-oauth2";
import User, { IUserDocument } from "../models/user.model";

const GOOGLE_CALLBACK_URL = `${process.env.API_BASE_URL}/api/auth/google/callback`;
const GITHUB_CALLBACK_URL = `${process.env.API_BASE_URL}/api/auth/github/callback`;

async function handleOAuthProfile(
    provider: "google" | "github",
    providerId: string,
    email: string,
    name: string,
    avatar: string,
    accessToken: string,
    refreshToken: string | undefined,
    done: VerifyCallback
) {
    try {
        let user: IUserDocument | null = await (User as any).findByOAuth(provider, providerId);

        if (user) {
            const profileIndex = user.oauthProfiles.findIndex(
                (p) => p.provider === provider && p.providerId === providerId
            );

            if (profileIndex !== -1) {
                user.oauthProfiles[profileIndex].accessToken = accessToken;
                if (refreshToken) user.oauthProfiles[profileIndex].refreshToken = refreshToken;
            }

            user.lastLoginAt = new Date();
            await user.save();
            return done(null, user);
        }

        user = await User.findOne({ email });

        if (user) {
            user.oauthProfiles.push({ provider, providerId, accessToken, refreshToken });
            user.lastLoginAt = new Date();
            await user.save();
            return done(null, user);
        }

        const newUser = await User.create({
            name,
            email,
            avatar,
            oauthProfiles: [{ provider, providerId, accessToken, refreshToken }],
            lastLoginAt: new Date(),
        });

        return done(null, newUser);
    } catch (error) {
        return done(error as Error);
    }
}

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            callbackURL: GOOGLE_CALLBACK_URL,
            scope: ["profile", "email"],
        },
        async (
            accessToken: string,
            refreshToken: string,
            profile: GoogleProfile,
            done: VerifyCallback
        ) => {
            const email = profile.emails?.[0]?.value ?? "";
            const avatar = profile.photos?.[0]?.value ?? "";
            await handleOAuthProfile(
                "google",
                profile.id,
                email,
                profile.displayName,
                avatar,
                accessToken,
                refreshToken,
                done
            );
        }
    )
);

passport.use(
    new GitHubStrategy(
        {
            clientID: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
            callbackURL: GITHUB_CALLBACK_URL,
            scope: ["user:email"],
        },
        async (
            accessToken: string,
            refreshToken: string,
            profile: GitHubProfile,
            done: VerifyCallback
        ) => {
            const email = profile.emails?.[0]?.value ?? "";
            const avatar = profile.photos?.[0]?.value ?? "";
            await handleOAuthProfile(
                "github",
                profile.id,
                email,
                profile.displayName || profile.username || "",
                avatar,
                accessToken,
                refreshToken,
                done
            );
        }
    )
);

export default passport;