import { model, Document, Model } from "mongoose";
import { IUser } from "../types/user.types";
import { userSchema } from "../schemas/user.schema";

export interface IUserDocument extends Omit<IUser, "_id">, Document {}

export interface IUserModel extends Model<IUserDocument> {
    findByOAuth(provider: string, providerId: string): Promise<IUserDocument | null>;
}

(userSchema.statics as any).findByOAuth = function (
    provider: string,
    providerId: string
): Promise<IUserDocument | null> {
    return this.findOne({
        oauthProfiles: {
            $elemMatch: { provider, providerId },
        },
    });
};

const User = model<IUserDocument, IUserModel>("User", userSchema as any);

export default User;