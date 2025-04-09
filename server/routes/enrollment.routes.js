import { Router } from "express";
import {
  enrollCourse,
  checkEnrollment,
  getUserEnrollments,
} from "../controllers/enrollment.controllers.js";
import { verifyJWTToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/check/:id", verifyJWTToken, checkEnrollment);

router.get("/user", verifyJWTToken, getUserEnrollments);

router.post("/enroll", verifyJWTToken, enrollCourse);

export default router;
