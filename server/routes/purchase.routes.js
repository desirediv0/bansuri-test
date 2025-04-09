import { Router } from "express";
import {
  createPurchase,
  checkPurchase,
  getMyPurchases,
  AdminGetAllPurchases,
  getCoursePurchaseHistory,
  getPurchaseStatistics,
} from "../controllers/purchase.controllers.js";
import { verifyJWTToken } from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/admin.middleware.js";

const router = Router();

router.post("/", verifyJWTToken, createPurchase);
router.get("/all", verifyJWTToken, verifyAdmin, AdminGetAllPurchases);
router.get("/my-course", verifyJWTToken, getMyPurchases);
router.get("/:courseId", verifyJWTToken, checkPurchase);
router.get("/course/:courseId/history", verifyAdmin, getCoursePurchaseHistory);
router.get("/statistics", verifyAdmin, getPurchaseStatistics);

export default router;
