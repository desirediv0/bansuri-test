import { Router } from "express";
import { verifyJWTToken } from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/admin.middleware.js";
import {
    getAdminDashboardData,
    assignCourseToUser,
    assignBulkCoursesToUsers,
    removeCourseAccess
} from "../controllers/admin.controllers.js";

const router = Router();

router.get(
    "/dashboard-data",
    verifyJWTToken,
    verifyAdmin,
    getAdminDashboardData
);

router.post(
    "/assign-course",
    verifyJWTToken,
    verifyAdmin,
    assignCourseToUser
);

// Add this new route
router.post(
    "/assign-bulk-courses",
    verifyJWTToken,
    verifyAdmin,
    assignBulkCoursesToUsers
);

// Add this new route
router.post(
    "/remove-course-access",
    verifyJWTToken,
    verifyAdmin,
    removeCourseAccess
);

export default router;