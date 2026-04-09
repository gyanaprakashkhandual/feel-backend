import { Schema } from "mongoose";

const LocationSchema = new Schema(
    {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
    },
    { _id: false }
);

const GoogleIntegrationSchema = new Schema(
    {
        accessToken: { type: String, required: true },
        refreshToken: { type: String, required: true },
        connected: { type: Boolean, default: false },
    },
    { _id: false }
);

const SpotifyIntegrationSchema = new Schema(
    {
        accessToken: { type: String, required: true },
        refreshToken: { type: String, required: true },
        connected: { type: Boolean, default: false },
    },
    { _id: false }
);

const IntegrationsSchema = new Schema(
    {
        google: { type: GoogleIntegrationSchema, default: null },
        spotify: { type: SpotifyIntegrationSchema, default: null },
    },
    { _id: false }
);

export const ProfileSchema = new Schema<import("../types/profile.types").IProfile>(
    {
        userId: { type: String, required: true, unique: true, ref: "User" },
        username: { type: String, required: true, unique: true, trim: true, lowercase: true },
        fullName: { type: String, required: true, trim: true },
        nickName: { type: String, trim: true, default: null },
        profilePicture: { type: String, default: null },
        bio: { type: String, maxlength: 300, default: null },
        location: { type: LocationSchema, default: null },
        integrations: { type: IntegrationsSchema, default: null },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);