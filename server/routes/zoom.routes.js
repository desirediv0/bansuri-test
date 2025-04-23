import { Router } from "express";
import { verifyJWTToken } from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/admin.middleware.js";
import {
  createZoomSession,
  getAllZoomSessions,
  updateZoomSession,
  deleteZoomSession,
  getUserZoomSessions,
  getMyZoomSubscriptions,
  createZoomSubscription,
  verifyZoomPayment,
  cancelZoomSubscription,
  checkZoomSubscription,
  getZoomSessionAttendees,
  sendMeetingReminders,
  processZoomRenewals,
  generateZoomReceipt,
  getZoomAnalytics,
  getAllZoomPayments,
  getAllZoomSubscriptions,
  adminCancelZoomSubscription,
  getZoomSession,
  approveZoomSubscription,
  rejectZoomSubscription,
  registerForZoomSession,
  verifyRegistrationPayment,
  payCourseAccess,
  verifyCourseAccessPayment,
  activateSessionLinks,
  getPendingApprovals,
  checkZoomPaymentStatus,
} from "../controllers/zoom.controllers.js";

const router = Router();

router.get("/sessions", getUserZoomSessions);
router.get("/session/:id", getZoomSession);

// Admin routes
router.post("/admin/session", verifyJWTToken, verifyAdmin, createZoomSession);
router.get("/admin/sessions", verifyJWTToken, verifyAdmin, getAllZoomSessions);
router.put(
  "/admin/session/:id",
  verifyJWTToken,
  verifyAdmin,
  updateZoomSession
);
router.delete(
  "/admin/session/:id",
  verifyJWTToken,
  verifyAdmin,
  deleteZoomSession
);
router.get(
  "/admin/session/:zoomSessionId/attendees",
  verifyJWTToken,
  verifyAdmin,
  getZoomSessionAttendees
);
router.post(
  "/admin/session/:zoomSessionId/send-reminders",
  verifyJWTToken,
  verifyAdmin,
  sendMeetingReminders
);
router.post(
  "/admin/process-renewals",
  verifyJWTToken,
  verifyAdmin,
  processZoomRenewals
);
router.get("/admin/payments", verifyJWTToken, verifyAdmin, getAllZoomPayments);
router.get("/admin/analytics", verifyJWTToken, verifyAdmin, getZoomAnalytics);
// Add new admin subscription routes
router.get(
  "/admin/subscriptions",
  verifyJWTToken,
  verifyAdmin,
  getAllZoomSubscriptions
);
router.post(
  "/admin/cancel-subscription/:id",
  verifyJWTToken,
  verifyAdmin,
  adminCancelZoomSubscription
);
// Add new approval routes
router.get(
  "/admin/pending-approvals",
  verifyJWTToken,
  verifyAdmin,
  getPendingApprovals
);
router.post(
  "/admin/approve-subscription/:subscriptionId",
  verifyJWTToken,
  verifyAdmin,
  approveZoomSubscription
);
router.post(
  "/admin/reject-subscription/:subscriptionId",
  verifyJWTToken,
  verifyAdmin,
  rejectZoomSubscription
);
// Add route for activating session links
router.post(
  "/admin/activate-session/:sessionId",
  verifyJWTToken,
  verifyAdmin,
  activateSessionLinks
);

// User routes

router.get("/my-subscriptions", verifyJWTToken, getMyZoomSubscriptions);
router.post("/subscribe", verifyJWTToken, createZoomSubscription);
router.post("/verify-payment", verifyJWTToken, verifyZoomPayment);
router.post(
  "/cancel-subscription/:subscriptionId",
  verifyJWTToken,
  cancelZoomSubscription
);
router.get(
  "/check-subscription/:zoomSessionId",
  verifyJWTToken,
  checkZoomSubscription
);
router.get(
  "/check-payment-status/:zoomSessionId",
  verifyJWTToken,
  checkZoomPaymentStatus
);
router.get("/receipt/:paymentId", verifyJWTToken, generateZoomReceipt);

// Registration routes
router.post("/register", verifyJWTToken, registerForZoomSession);
router.post("/verify-registration", verifyJWTToken, verifyRegistrationPayment);

// Course access routes
router.post("/pay-course-access", verifyJWTToken, payCourseAccess);
router.post("/verify-course-access", verifyJWTToken, verifyCourseAccessPayment);

// Add this route for debugging
router.get("/debug/all-sessions", verifyJWTToken, async (req, res) => {
  try {
    const allSessions = await prisma.zoomSession.findMany({
      orderBy: {
        startTime: "desc",
      },
      include: {
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    const sessionsInfo = allSessions.map((session) => ({
      id: session.id,
      title: session.title,
      isActive: session.isActive,
      startTime: session.startTime,
      isPastSession: new Date(session.startTime) < new Date(),
      createdBy: session.createdBy?.name || "Unknown",
    }));

    return res.status(200).json({
      statusCode: 200,
      data: {
        totalSessions: sessionsInfo.length,
        activeSessions: sessionsInfo.filter((s) => s.isActive).length,
        futureSessions: sessionsInfo.filter(
          (s) => new Date(s.startTime) >= new Date()
        ).length,
        sessions: sessionsInfo,
      },
      message: "Debug info for all sessions",
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      statusCode: 500,
      message: error.message,
      success: false,
    });
  }
});

export default router;
