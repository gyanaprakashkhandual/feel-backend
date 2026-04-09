import { model, models } from "mongoose";
import { todoSchema } from "../schemas/todo.schema";
import { ITodoDocument } from "../types/todo.types";

export const Todo = models.Todo || model<ITodoDocument>("Todo", todoSchema);