import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import Razorpay from "razorpay";
import userRoutes from "./routes/user.routes.js";
import courseRoutes from "./routes/course.routes.js";
import chapterRoutes from "./routes/chapter.routes.js";
import enrollmentRoutes from "./routes/enrollment.routes.js";
import userProgressRoutes from "./routes/userProgress.routes.js";
import purchaseRoutes from "./routes/purchase.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import billingDetailsRoutes from "./routes/billingDetails.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import couponRoutes from "./routes/coupon.routes.js";
import sectionRoutes from "./routes/section.routes.js";
import categoryRouter from "./routes/category.routes.js";
import feeRoutes from "./routes/fee.routes.js";
import certificateRoutes from "./routes/certificate.routes.js";
import visibilityRoutes from "./routes/visibility.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import contactRoutes from "./routes/contactRoutes.js";
import zoomLiveClassRoutes from "./routes/zoomLiveClass.routes.js";
import uploadRoutes from "./routes/upload.routes.js";

const app = express();

// Security & Parse Middlewares
app.use(express.json());

app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// CORS Configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN.split(","),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Cache-Control",
      "Pragma",
      "Origin",
      "Accept",
    ],
    exposedHeaders: ["Set-Cookie"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);
// Cache Control Headers
app.use((req, res, next) => {
  res.header("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.header("Pragma", "no-cache");
  res.header("Expires", "0");
  res.header("X-Content-Type-Options", "nosniff");
  res.header("X-Frame-Options", "DENY");
  res.header("X-XSS-Protection", "1; mode=block");
  res.header(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );
  next();
});
// Static Files
app.use(express.static("public/upload"));

// Initialize Razorpay
let razorpay;
try {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  console.log("Razorpay Initialized Successfully:");
} catch (error) {
  console.error("Razorpay Initialization Error:", error);
}

export { razorpay };

// API Routes
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/course", courseRoutes);
app.use("/api/v1/chapter", chapterRoutes);
app.use("/api/v1/enrollment", enrollmentRoutes);
app.use("/api/v1/user-progress", userProgressRoutes);
app.use("/api/v1/purchase", purchaseRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/billing", billingDetailsRoutes);
app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/review", reviewRoutes);
app.use("/api/v1/coupon", couponRoutes);
app.use("/api/v1/section", sectionRoutes);
app.use("/api/v1/category", categoryRouter);
app.use("/api/v1/fees", feeRoutes);
app.use("/api/v1/certificates", certificateRoutes);
app.use("/api/v1/visibility", visibilityRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/contact", contactRoutes);
app.use("/api/v1/zoom-live-class", zoomLiveClassRoutes);
app.use("/api/v1/upload", uploadRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err : {},
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

export default app;
