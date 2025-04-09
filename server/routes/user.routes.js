import { Router } from "express";
import {
  deleteUser,
  forgotPassword,
  getAllUsers,
  GetLoggedInUser,
  loginUser,
  logoutUser,
  refreshToken,
  registerUser,
  reSendVerificationEmail,
  updateName,
  updatePassword,
  verifyEmail,
  checkUserLoggedIn,
  resetPassword,
  checkAuth,
  getUserBySlug,
  googleAuth,
  AdminGetUserBySlug,
  AdminUpdateUser,
  AdminDeleteUser,
  ImportDataFromExcel,
} from "../controllers/user.controllers.js";
import { verifyJWTToken } from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/admin.middleware.js";
import multer from 'multer';


const router = Router();

// auth routes
router.route("/register").post(registerUser);
router.route("/google-auth").post(googleAuth);
router.route("/verify-email").post(verifyEmail);
router.route("/login").post(loginUser);
router.route("/resend-verification-email").post(reSendVerificationEmail);
router.route("/forgot-password").post(forgotPassword);
router.route("/check-logged-in").get(checkUserLoggedIn);
router.route("/reset-password").post(resetPassword);

// secure routes
router.route("/logout").post(verifyJWTToken, logoutUser);
router.route("/update-name").patch(verifyJWTToken, updateName);
router.route("/update-password").patch(verifyJWTToken, updatePassword);
router.route("/refresh-token").post(verifyJWTToken, refreshToken);
router.route("/delete-user").delete(verifyJWTToken, deleteUser);
router.route("/get-user").get(verifyJWTToken, GetLoggedInUser);
router.route("/check-auth").get(verifyJWTToken, checkAuth);

// admin routes
router.route("/get-all-users").get(verifyJWTToken, verifyAdmin, getAllUsers);
router
  .route("/get-all-users/:slug")
  .get(verifyJWTToken, verifyAdmin, getUserBySlug);

router
  .route("/admin-update-user/:slug")
  .patch(verifyJWTToken, verifyAdmin, AdminUpdateUser);

router
  .route("/admin-get-user/:slug")
  .get(verifyJWTToken, verifyAdmin, AdminGetUserBySlug);

router
  .route("/admin-delete-user/:slug")
  .delete(verifyJWTToken, verifyAdmin, AdminDeleteUser);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

router
  .route("/import-users")
  .post(
    verifyJWTToken,
    verifyAdmin,
    upload.single('file'),
    ImportDataFromExcel
  );

export default router;
