import { Router } from "express";
import cors from "cors";
import {
    getUserCertificates,
    downloadCertificate,
    shareCertificate,
    getAllCertificates,
    generateCertificate,
    updateCertificate,
    deleteCertificate,
    verifyCertificate
} from "../controllers/certificate.controllers.js";
import { verifyJWTToken } from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/admin.middleware.js";

const router = Router();

// Configure CORS for certificate routes
const certificateCors = cors({
    origin: process.env.CORS_ORIGIN.split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
});

// Apply CORS to all certificate routes
router.use(certificateCors);

// Public routes
router.get("/verify/:certificateId", verifyCertificate);

// Protected routes
router.get("/user", verifyJWTToken, getUserCertificates);
router.get("/download/:certificateId", verifyJWTToken, downloadCertificate);
router.get("/share/:certificateId", verifyJWTToken, shareCertificate);

// Admin routes
router.get("/all", verifyJWTToken, verifyAdmin, getAllCertificates);
router.post("/generate", verifyJWTToken, verifyAdmin, generateCertificate);
router.put("/update/:certificateId", verifyJWTToken, verifyAdmin, updateCertificate);
router.delete("/delete/:certificateId", verifyJWTToken, verifyAdmin, deleteCertificate);

export default router; 