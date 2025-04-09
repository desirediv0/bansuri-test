import { Router } from "express";
import {
  markChapterComplete,
  getCourseProgress,
  updateProgress,
  getProgress,
} from "../controllers/userProgress.controllers.js";
import { verifyJWTToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/complete", verifyJWTToken, markChapterComplete);
router.post("/update", verifyJWTToken, updateProgress);
router.get("/chapter/:chapterId", verifyJWTToken, getProgress);
router.get("/course/:courseId", verifyJWTToken, getCourseProgress);

export default router;
