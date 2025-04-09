import { Router } from "express";

import { verifyJWTToken } from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/admin.middleware.js";
import { getCourseAccessList, getVisibleCourses, grantCourseAccess, revokeCourseAccess } from "../controllers/visibility.controllers.js";

const router = Router();

// Admin routes
router.post("/grant", verifyJWTToken, verifyAdmin, grantCourseAccess);
router.post("/revoke", verifyJWTToken, verifyAdmin, revokeCourseAccess);
router.get("/access-list/:courseId", verifyJWTToken, verifyAdmin, getCourseAccessList);

// User routes
router.get("/visible", verifyJWTToken, getVisibleCourses);

export default router;