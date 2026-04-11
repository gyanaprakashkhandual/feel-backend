import { Types } from "mongoose";
import { Todo } from "../../models/todo.model";
import { ITodoContext, ITodoSnapshot } from "../../types/mood.types";

const TODO_WINDOW_MINUTES = 60;

const mapTodoToSnapshot = (todo: any, now: Date): ITodoSnapshot => ({
    todoId: todo._id as Types.ObjectId,
    title: todo.title,
    priority: todo.priority,
    status: todo.status,
    dueDate: todo.endDate ?? null,
    isOverdue: todo.endDate ? new Date(todo.endDate) < now : false,
    tags: todo.tags ?? [],
});

export const getTodoContext = async (
    userId: Types.ObjectId,
    timestamp: Date
): Promise<ITodoContext> => {
    const dayStart = new Date(timestamp);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(timestamp);
    dayEnd.setHours(23, 59, 59, 999);

    const windowStart = new Date(timestamp.getTime() - TODO_WINDOW_MINUTES * 60 * 1000);
    const windowEnd = new Date(timestamp.getTime() + TODO_WINDOW_MINUTES * 60 * 1000);

    const wholeDayRaw = await Todo.find({
        owner: userId,
        status: { $in: ["pending", "in_progress"] },
        $or: [
            { endDate: { $gte: dayStart, $lte: dayEnd } },
            { endDate: { $lt: timestamp } },
        ],
    })
        .select("title priority status endDate tags")
        .sort({ priority: -1, endDate: 1 })
        .lean();

    const wholeDayTodos = wholeDayRaw.map((todo) => mapTodoToSnapshot(todo, timestamp));

    const windowTodos = wholeDayTodos.filter((todo) => {
        if (!todo.dueDate) return false;
        return todo.dueDate >= windowStart && todo.dueDate <= windowEnd;
    });

    const overdueCount = wholeDayTodos.filter((todo) => todo.isOverdue).length;

    return { wholeDayTodos, windowTodos, windowStart, windowEnd, overdueCount };
};