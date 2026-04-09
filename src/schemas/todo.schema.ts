import { Schema } from "mongoose";
import { ITodoDocument } from "../types/todo.types";


const todoLinkSchema = new Schema(
    {
        label: { type: String, required: true, trim: true },
        url: { type: String, required: true, trim: true },
    },
    { _id: false }
);

const todoImageSchema = new Schema(
    {
        url: { type: String, required: true },
        key: { type: String, required: true },
    },
    { _id: false }
);

export const todoSchema = new Schema<ITodoDocument>(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, trim: true },
        slug: { type: String, required: true },
        startDate: { type: Date },
        startTime: { type: String },
        endDate: { type: Date },
        endTime: { type: String },
        priority: {
            type: String,
            enum: ["low", "medium", "high", "urgent"],
            default: "medium",
        },
        status: {
            type: String,
            enum: ["pending", "in_progress", "completed", "cancelled"],
            default: "pending",
        },
        links: { type: [todoLinkSchema], default: [] },
        images: { type: [todoImageSchema], default: [] },
        tags: { type: [String], default: [] },
        owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
        parent: { type: Schema.Types.ObjectId, ref: "Todo", default: null },
        subTasks: [{ type: Schema.Types.ObjectId, ref: "Todo" }],
        depth: { type: Number, default: 0 },
        ancestors: [{ type: Schema.Types.ObjectId, ref: "Todo" }],
    },
    {
        timestamps: true,
        toJSON: {
            transform: (_doc, ret) => {
                delete (ret as any).__v;
                return ret;
            },
        },
    }
);

todoSchema.index({ owner: 1, status: 1 });
todoSchema.index({ owner: 1, priority: 1 });
todoSchema.index({ owner: 1, parent: 1 });
todoSchema.index({ owner: 1, ancestors: 1 });
todoSchema.index({ owner: 1, tags: 1 });
todoSchema.index({ owner: 1, slug: 1 }, { unique: true });
todoSchema.index({ title: "text", description: "text", tags: "text" });
