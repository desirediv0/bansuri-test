import { Router } from "express";
import multer from "multer";
import { verifyJWTToken } from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/admin.middleware.js";
import { uploadZoomThumbnail } from "../controllers/upload.controllers.js";

const router = Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Route for uploading zoom session thumbnails
router.post(
    "/zoom-thumbnail",
    verifyJWTToken,
    verifyAdmin,
    upload.single("image"),
    uploadZoomThumbnail
);

export default router;
