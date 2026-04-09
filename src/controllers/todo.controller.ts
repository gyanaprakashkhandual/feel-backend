import { Response } from "express";
import { isValidObjectId, Types } from "mongoose";
import { AuthRequest } from "../middlewares/user.middleware";
import { Todo } from "../models/todo.model";
import { ICreateTodoBody, IUpdateTodoBody, ITodoSearchQuery } from "../types/todo.types";

const generateSlug = (title: string): string =>
    title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");

async function getAllDescendantIds(parentId: string): Promise<string[]> {
    const subTasks = await Todo.find({ parent: new Types.ObjectId(parentId) }, "_id").lean();

    if (!subTasks.length) return [];

    const subTaskIds = subTasks.map((t) => (t._id as Types.ObjectId).toString());
    const nested = await Promise.all(subTaskIds.map((id: string) => getAllDescendantIds(id)));

    return [...subTaskIds, ...nested.flat()];
}

export const createTodo = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const body: ICreateTodoBody = req.body;

        let depth = 0;
        let ancestors: Types.ObjectId[] = [];

        if (body.parentId) {
            if (!isValidObjectId(body.parentId)) {
                res.status(400).json({ success: false, message: "Invalid parent ID" });
                return;
            }

            const parent = await Todo.findOne({ _id: body.parentId, owner: userId });

            if (!parent) {
                res.status(404).json({ success: false, message: "Parent todo not found" });
                return;
            }

            depth = parent.depth + 1;
            ancestors = [
                ...parent.ancestors.map((a: Types.ObjectId) => a),
                parent._id,
            ];
        }

        const todo = await Todo.create({
            title: body.title,
            slug: generateSlug(body.title),
            description: body.description,
            startDate: body.startDate,
            startTime: body.startTime,
            endDate: body.endDate,
            endTime: body.endTime,
            priority: body.priority ?? "medium",
            status: body.status ?? "pending",
            links: body.links ?? [],
            images: body.images ?? [],
            tags: body.tags ?? [],
            owner: userId,
            parent: body.parentId ? new Types.ObjectId(body.parentId) : null,
            depth,
            ancestors,
        });

        if (body.parentId) {
            await Todo.findByIdAndUpdate(body.parentId, {
                $push: { subTasks: todo._id },
            });
        }

        res.status(201).json({ success: true, todo });
    } catch (error) {
        console.error("createTodo error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const getTodos = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const query = req.query as ITodoSearchQuery;
        const page = Math.max(1, parseInt(query.page ?? "1"));
        const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? "20")));
        const skip = (page - 1) * limit;

        const filter = { owner: new Types.ObjectId(userId), parent: null };

        const [todos, total] = await Promise.all([
            Todo.find(filter).sort({ createdAt: -1 as const }).skip(skip).limit(limit).lean(),
            Todo.countDocuments(filter),
        ]);

        res.status(200).json({
            success: true,
            todos,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("getTodos error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const getTodoById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const id = req.params["id"] as string;

        const todo = await Todo.findOne({ _id: id, owner: new Types.ObjectId(userId) })
            .populate("subTasks")
            .lean();

        if (!todo) {
            res.status(404).json({ success: false, message: "Todo not found" });
            return;
        }

        res.status(200).json({ success: true, todo });
    } catch (error) {
        console.error("getTodoById error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const getChildTodos = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const id = req.params["id"] as string;
        const query = req.query as ITodoSearchQuery;
        const page = Math.max(1, parseInt(query.page ?? "1"));
        const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? "20")));
        const skip = (page - 1) * limit;

        const filter = { owner: new Types.ObjectId(userId), parent: new Types.ObjectId(id) };

        const [todos, total] = await Promise.all([
            Todo.find(filter).sort({ createdAt: -1 as const }).skip(skip).limit(limit).lean(),
            Todo.countDocuments(filter),
        ]);

        res.status(200).json({
            success: true,
            todos,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("getChildTodos error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const updateTodo = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = req.params["id"] as string;
        const body: IUpdateTodoBody = req.body;

        const updated = await Todo.findByIdAndUpdate(
            id,
            {
                $set: {
                    ...(body.title !== undefined && {
                        title: body.title,
                        slug: generateSlug(body.title),
                    }),
                    ...(body.description !== undefined && { description: body.description }),
                    ...(body.startDate !== undefined && { startDate: body.startDate }),
                    ...(body.startTime !== undefined && { startTime: body.startTime }),
                    ...(body.endDate !== undefined && { endDate: body.endDate }),
                    ...(body.endTime !== undefined && { endTime: body.endTime }),
                    ...(body.priority !== undefined && { priority: body.priority }),
                    ...(body.status !== undefined && { status: body.status }),
                    ...(body.links !== undefined && { links: body.links }),
                    ...(body.images !== undefined && { images: body.images }),
                    ...(body.tags !== undefined && { tags: body.tags }),
                },
            },
            { new: true, runValidators: true }
        );

        if (!updated) {
            res.status(404).json({ success: false, message: "Todo not found" });
            return;
        }

        res.status(200).json({ success: true, todo: updated });
    } catch (error) {
        console.error("updateTodo error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const deleteTodo = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = req.params["id"] as string;

        const todo = await Todo.findById(id);

        if (!todo) {
            res.status(404).json({ success: false, message: "Todo not found" });
            return;
        }

        const descendantIds = await getAllDescendantIds(id);
        const idsToDelete = [id, ...descendantIds];

        await Todo.deleteMany({ _id: { $in: idsToDelete } });

        if (todo.parent) {
            await Todo.findByIdAndUpdate(todo.parent, {
                $pull: { subTasks: todo._id },
            });
        }

        res.status(200).json({ success: true, message: "Todo and all descendants deleted" });
    } catch (error) {
        console.error("deleteTodo error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const searchTodos = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const query = req.query as ITodoSearchQuery;
        const page = Math.max(1, parseInt(query.page ?? "1"));
        const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? "20")));
        const skip = (page - 1) * limit;

        const filter: Record<string, unknown> = { owner: new Types.ObjectId(userId) };

        if (query.q) {
            filter.$text = { $search: query.q };
        }

        if (query.status) filter.status = query.status;
        if (query.priority) filter.priority = query.priority;

        if (query.tags) {
            const tagList = query.tags.split(",").map((t: string) => t.trim());
            filter.tags = { $in: tagList };
        }

        if (query.startDate) filter.startDate = { $gte: new Date(query.startDate) };
        if (query.endDate) filter.endDate = { $lte: new Date(query.endDate) };

        if (query.parentId) {
            filter.parent = isValidObjectId(query.parentId)
                ? new Types.ObjectId(query.parentId)
                : null;
        }

        const [todos, total] = await Promise.all([
            Todo.find(filter, query.q ? { score: { $meta: "textScore" } } : {})
                .sort(query.q ? { score: { $meta: "textScore" } } : { createdAt: -1 as const })
                .skip(skip)
                .limit(limit)
                .lean(),
            Todo.countDocuments(filter),
        ]);

        res.status(200).json({
            success: true,
            todos,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("searchTodos error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};