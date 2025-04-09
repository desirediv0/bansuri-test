import { Router } from "express";
import {
  createBillingDetails,
  getBillingDetailsByUser,
  getSavedAddressesByUser,
  updateBillingDetails,
  deleteBillingDetails,
  paymentStatusToggle,
  admingetAllBillingDetails,
} from "../controllers/billingDetails.controllers.js";
import { verifyJWTToken } from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/admin.middleware.js";

const router = Router();

router
  .route("/")
  .post(verifyJWTToken, createBillingDetails)
  .get(verifyJWTToken, getBillingDetailsByUser);

router.route("/addresses").get(verifyJWTToken, getSavedAddressesByUser);
router.route("/payment-status/:id").put(verifyJWTToken, paymentStatusToggle);

router
  .route("/:id")
  .put(verifyJWTToken, verifyAdmin, updateBillingDetails)
  .delete(verifyJWTToken, verifyAdmin, deleteBillingDetails);
router
  .route("/get-all-billing-details")
  .get(verifyJWTToken, verifyAdmin, admingetAllBillingDetails);

export default router;
