import { Schema } from "mongoose";
import { IUser } from "../types/user.types";

const oauthProfileSchema = new Schema(
    {
        provider: { type: String, enum: ["google", "github"], required: true },
        providerId: { type: String, required: true },
        accessToken: { type: String, required: true },
        refreshToken: { type: String },
    },
    { _id: false }
);

const privacySettingsSchema = new Schema(
    {
        contributeToCollective: { type: Boolean, default: false },
        shareWithTherapist: { type: Boolean, default: false },
        therapistId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    },
    { _id: false }
);

export const userSchema = new Schema<IUser>(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        avatar: { type: String },
        role: {
            type: String,
            enum: ["individual", "premium", "therapist", "hr_admin", "researcher", "super_admin"],
            default: "individual",
        },
        timezone: { type: String, default: "UTC" },
        oauthProfiles: { type: [oauthProfileSchema], default: [] },
        connectedApps: { type: [String], default: [] },
        privacySettings: { type: privacySettingsSchema, default: () => ({}) },
        isActive: { type: Boolean, default: true },
        lastLoginAt: { type: Date, default: Date.now },
    },
    {
        timestamps: true,
        toJSON: {
            transform: (_doc, ret) => {
                delete (ret as any).oauthProfiles;
                delete (ret as any).__v;
                return ret;
            },
        },
    }
);

userSchema.index({ email: 1 });
userSchema.index({ "oauthProfiles.provider": 1, "oauthProfiles.providerId": 1 });

(userSchema.statics as any).findByOAuth = function (provider: string, providerId: string) {
    return this.findOne({
        oauthProfiles: {
            $elemMatch: { provider, providerId },
        },
    });
};