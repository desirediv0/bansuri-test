import { Router } from "express";
import {
  createCoupon,
  getAllCoupons,
  updateCoupon,
  deleteCoupon,
  applyCoupon,
  getCourses,
} from "../controllers/coupon.controllers.js";
import { verifyJWTToken } from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/admin.middleware.js";

const router = Router();

router.route("/courses").get(getCourses);
router
  .route("/")
  .post(verifyJWTToken, verifyAdmin, createCoupon)
  .get(getAllCoupons);

router.route("/apply").post(verifyJWTToken, applyCoupon);

router
  .route("/:id")
  .put(verifyJWTToken, updateCoupon)
  .delete(verifyJWTToken, deleteCoupon);

export default router;
