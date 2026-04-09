import { Router, Request, Response, NextFunction } from "express";
import {
    createTodo,
    getTodos,
    getTodoById,
    getChildTodos,
    updateTodo,
    deleteTodo,
    searchTodos,
} from "../controllers/todo.controller";
import { authenticate } from "../middlewares/user.middleware";
import { validateTodoOwnership } from "../middlewares/todo.middlewares";
import { AuthRequest } from "../middlewares/user.middleware";

const router = Router();

const wrap =
    (fn: (req: AuthRequest, res: Response) => Promise<void>) =>
        (req: Request, res: Response, next: NextFunction) =>
            fn(req as AuthRequest, res).catch(next);

router.use(authenticate);

router.get("/search", wrap(searchTodos));
router.get("/", wrap(getTodos));
router.post("/", wrap(createTodo));
router.get("/:id", validateTodoOwnership, wrap(getTodoById));
router.get("/:id/children", validateTodoOwnership, wrap(getChildTodos));
router.patch("/:id", validateTodoOwnership, wrap(updateTodo));
router.delete("/:id", validateTodoOwnership, wrap(deleteTodo));

export default router;