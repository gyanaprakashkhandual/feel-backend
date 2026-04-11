import { Router } from "express";
import {
    createMood,
    getMoods,
    getMoodById,
    updateMood,
    deleteMood,
    getMoodStats,
    getMoodContext,
    retryMoodContext,
} from "../controllers/mood.controller";
import {
    validateCreateMood,
    validateGetMoodsQuery,
} from "../middlewares/mood.middleware";
import { authenticate } from "../middlewares/user.middleware";

const router = Router();

router.use(authenticate);

router.post("/", validateCreateMood, createMood);

router.get("/", validateGetMoodsQuery, getMoods);

router.get("/stats", validateGetMoodsQuery, getMoodStats);

router.get("/:id", getMoodById);

router.get("/:id/context", getMoodContext);

router.patch("/:id", validateCreateMood, updateMood);

router.delete("/:id", deleteMood);

router.post("/:id/retry-context", retryMoodContext);

export default router;