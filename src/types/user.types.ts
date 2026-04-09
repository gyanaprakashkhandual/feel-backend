import { Types } from "mongoose";

export type UserRole = "individual" | "premium" | "therapist" | "hr_admin" | "researcher" | "super_admin";

export type OAuthProvider = "google" | "github";

export interface IOAuthProfile {
    provider: OAuthProvider;
    providerId: string;
    accessToken: string;
    refreshToken?: string;
}

export interface IPrivacySettings {
    contributeToCollective: boolean;
    shareWithTherapist: boolean;
    therapistId?: string;
}

export interface IUser {
    _id: Types.ObjectId;
    name: string;
    email: string;
    avatar?: string;
    role: UserRole;
    timezone: string;
    oauthProfiles: IOAuthProfile[];
    connectedApps: string[];
    privacySettings: IPrivacySettings;
    isActive: boolean;
    lastLoginAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface IAuthTokenPayload {
    userId: string;
    email: string;
    role: UserRole;
}

export interface IAuthResponse {
    user: Omit<IUser, "oauthProfiles">;
    accessToken: string;
    refreshToken: string;
}