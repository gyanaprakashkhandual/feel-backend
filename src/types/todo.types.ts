import { Types, Document } from "mongoose";

export type TodoPriority = "low" | "medium" | "high" | "urgent";
export type TodoStatus = "pending" | "in_progress" | "completed" | "cancelled";

export interface ITodoLink {
    label: string;
    url: string;
}

export interface ITodoImage {
    url: string;
    key: string;
}

export interface ITodoDocument extends Document {
    _id: Types.ObjectId;
    title: string;
    description?: string;
    slug: string;
    startDate?: Date;
    startTime?: string;
    endDate?: Date;
    endTime?: string;
    priority: TodoPriority;
    status: TodoStatus;
    links: ITodoLink[];
    images: ITodoImage[];
    tags: string[];
    owner: Types.ObjectId;
    parent: Types.ObjectId | null;
    subTasks: Types.ObjectId[];
    depth: number;
    ancestors: Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

export interface ICreateTodoBody {
    title: string;
    description?: string;
    startDate?: string;
    startTime?: string;
    endDate?: string;
    endTime?: string;
    priority?: TodoPriority;
    status?: TodoStatus;
    links?: ITodoLink[];
    images?: ITodoImage[];
    tags?: string[];
    parentId?: string;
}

export interface IUpdateTodoBody extends Partial<ICreateTodoBody> { }

export interface ITodoSearchQuery {
    q?: string;
    status?: TodoStatus;
    priority?: TodoPriority;
    tags?: string;
    startDate?: string;
    endDate?: string;
    parentId?: string;
    page?: string;
    limit?: string;
}