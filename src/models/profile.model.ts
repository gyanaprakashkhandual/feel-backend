import { model, models, Model } from "mongoose";
import { ProfileSchema } from "../schemas/profile.schema";
import { IProfile } from "../types/profile.types";

const Profile: Model<IProfile> = models.Profile || model<IProfile>("Profile", ProfileSchema);

export default Profile;