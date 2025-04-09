import { Router } from "express";
import { verifyJWTToken } from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/admin.middleware.js";
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory
} from "../controllers/category.controllers.js";

const router = Router();

router.get("/", getAllCategories);
router.post("/",  createCategory);
router.put("/:id", verifyJWTToken, verifyAdmin, updateCategory);
router.delete("/:id", verifyJWTToken, verifyAdmin, deleteCategory);

export default router;