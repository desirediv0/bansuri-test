import { Router } from "express";
import {
  updateReview,
  deleteReview,
  getCourseReviews,
  createReview,
  getAllReviews,
} from "../controllers/review.controllers.js";
import { verifyJWTToken } from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/admin.middleware.js";

const router = Router();

router.get("/course/:courseId", getCourseReviews);

// Protected routes
router.use(verifyJWTToken);
router.post("/create", createReview);
router.put("/update/:id", updateReview);
router.delete("/delete/:id", deleteReview);

router.get("/admin/all", verifyJWTToken, verifyAdmin, getAllReviews);


export default router;
