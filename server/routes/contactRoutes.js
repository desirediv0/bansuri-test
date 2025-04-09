import express from "express";
import { submitContactForm, getContactFormSubmissions } from "../controllers/ContactController.js";
import { verifyJWTToken } from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/admin.middleware.js";

const router = express.Router();

router.post("/submit", submitContactForm);

router.get("/get-all", verifyJWTToken, verifyAdmin, getContactFormSubmissions);

export default router;
