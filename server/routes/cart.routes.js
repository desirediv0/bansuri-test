import { Router } from "express";
import {
  addToCart,
  getCartItemsByUser,
  removeFromCart,
  addToCartByCourseSlug,
} from "../controllers/cart.controllers.js";
import { verifyJWTToken } from "../middlewares/auth.middleware.js";

const router = Router();

router
  .route("/")
  .post(verifyJWTToken, addToCart)
  .get(verifyJWTToken, getCartItemsByUser);

router.route("/add/:slug").post(verifyJWTToken, addToCartByCourseSlug);

router.route("/:id").delete(verifyJWTToken, removeFromCart);

export default router;
