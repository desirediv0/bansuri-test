import { Router } from "express";
import {
  checkout,
  getRazorpayKey,
  paymentVerification,
} from "../controllers/payment.controllers.js";
import { verifyJWTToken } from "../middlewares/auth.middleware.js";

const router = Router();
router.get("/getkey", verifyJWTToken, getRazorpayKey);
router.route("/checkout").post(verifyJWTToken, checkout);
router.route("/payment-verification").post(verifyJWTToken, paymentVerification);

export default router;
