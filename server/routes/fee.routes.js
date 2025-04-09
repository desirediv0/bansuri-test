import { Router } from "express";
import { verifyJWTToken } from "../middlewares/auth.middleware.js";
import {
    createFee,
    updateFee,
    deleteFee,
    getFeeDetails,
    getAllFees,
    payFee,
    verifyFeePayment,
    getFeeHistory,
    generateFeeReceipt,
    getAllStudents,
    getFeeAnalytics,
} from "../controllers/fee.controllers.js";
import { verifyAdmin } from "../middlewares/admin.middleware.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";

const router = Router();

// Student routes
router.get("/details", verifyJWTToken, getFeeDetails);
router.post("/pay", verifyJWTToken, payFee);
router.post("/verify-payment", verifyJWTToken, verifyFeePayment);
router.get("/receipt/:paymentId", verifyJWTToken, generateFeeReceipt);
router.get("/history", verifyJWTToken, getFeeHistory);

// Admin routes
router.post("/create", verifyJWTToken, verifyAdmin, createFee);
router.patch("/update/:feeId", verifyJWTToken, verifyAdmin, updateFee);
router.delete("/delete/:feeId", verifyJWTToken, verifyAdmin, deleteFee);
router.get("/students", verifyJWTToken, verifyAdmin, getAllStudents);
router.get("/all", verifyJWTToken, verifyAdmin, getAllFees);

// Add this new route for analytics
router.get("/analytics", verifyJWTToken, verifyAdmin, getFeeAnalytics);

// Add this new route
router.get("/getkey", verifyJWTToken, (req, res) => {
    return res.status(200).json(
        new ApiResponsive(200, { key: process.env.RAZORPAY_KEY_ID }, "Razorpay key fetched successfully")
    );
});

export default router;