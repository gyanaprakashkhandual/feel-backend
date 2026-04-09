import { Request, Response, NextFunction } from "express";
import { isValidObjectId } from "mongoose";
import { AuthRequest } from "./user.middleware";
import { Todo } from "../models/todo.model";

export const validateTodoOwnership = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authReq = req as AuthRequest;
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            res.status(400).json({ success: false, message: "Invalid todo ID" });
            return;
        }

        const todo = await Todo.findById(id);

        if (!todo) {
            res.status(404).json({ success: false, message: "Todo not found" });
            return;
        }

        if (todo.owner.toString() !== authReq.user?.userId) {
            res.status(403).json({ success: false, message: "Forbidden" });
            return;
        }

        next();
    } catch (error) {
        console.error("validateTodoOwnership error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};