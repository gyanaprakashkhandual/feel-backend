import { Document, Model, Types } from "mongoose";
import mongoose from "mongoose";
import { IUser } from "../types/user.types";
import { userSchema } from "../schemas/user.schema";

export interface IUserDocument extends Omit<IUser, "_id">, Document {
    _id: Types.ObjectId;
}

export interface IUserModel extends Model<IUserDocument> {
    findByOAuth(provider: string, providerId: string): Promise<IUserDocument | null>;
}

const User = (mongoose.models.User as IUserModel) ||
    mongoose.model<IUserDocument, IUserModel>("User", userSchema);

export default User;