import { model } from "mongoose";
import { IMoodDocument } from "../types/mood.types";
import { moodSchema } from "../schemas/mood.schema";

export const Mood = model<IMoodDocument>("Mood", moodSchema);