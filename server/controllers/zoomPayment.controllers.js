import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { razorpay } from "../app.js";
import crypto from "crypto";
import { SendEmail } from "../email/SendEmail.js";

// User: Get my subscribed Zoom classes
export const getMyZoomSubscriptions = asyncHandler(async (req, res) => {
  try {
    const subscriptions = await prisma.zoomSubscription.findMany({
      where: {
        userId: req.user.id,
      },
      include: {
        zoomLiveClass: {
          include: {
            createdBy: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // Transform data for better frontend display
    const transformedSubscriptions = subscriptions.map((sub) => ({
      ...sub,
      zoomSession: {
        ...sub.zoomLiveClass,
        id: sub.zoomLiveClass.id,
        title: sub.zoomLiveClass.title,
        teacherName: sub.zoomLiveClass.createdBy?.name || "Instructor",
        formattedDate: new Date(sub.zoomLiveClass.startTime).toLocaleDateString(
          "en-US",
          {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          }
        ),
        formattedTime: new Date(sub.zoomLiveClass.startTime).toLocaleTimeString(
          "en-US",
          {
            hour: "2-digit",
            minute: "2-digit",
          }
        ),
        duration: Math.ceil(
          (new Date(sub.zoomLiveClass.endTime || new Date()) -
            new Date(sub.zoomLiveClass.startTime)) /
            (60 * 1000)
        ),
      },
      zoomLiveClass: undefined,
    }));

    return res
      .status(200)
      .json(
        new ApiResponsive(
          200,
          transformedSubscriptions,
          "Your subscriptions fetched successfully"
        )
      );
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    throw new ApiError(500, "Failed to fetch your subscriptions");
  }
});

// User: Register for Zoom Live Class (pay registration fee)
export const registerForZoomLiveClass = asyncHandler(async (req, res) => {
  const { zoomLiveClassId } = req.body;

  const zoomLiveClass = await prisma.zoomLiveClass.findUnique({
    where: { id: zoomLiveClassId },
  });

  if (!zoomLiveClass) {
    throw new ApiError(404, "Zoom live class not found");
  }

  if (!zoomLiveClass.isActive) {
    throw new ApiError(400, "This Zoom live class is not active");
  }

  // Validate that the registration fee is set
  if (zoomLiveClass.registrationFee <= 0) {
    throw new ApiError(400, "Invalid registration fee");
  }

  // Check if user already has an active registration
  const existingRegistration = await prisma.zoomSubscription.findFirst({
    where: {
      userId: req.user.id,
      zoomLiveClassId,
      isRegistered: true,
    },
  });

  if (existingRegistration) {
    // Return success instead of error if already registered
    return res.status(200).json(
      new ApiResponsive(
        200,
        {
          alreadyRegistered: true,
          subscription: existingRegistration,
        },
        "You are already registered for this class"
      )
    );
  }

  // Check if user had a previous subscription but canceled it
  const cancelledSubscription = await prisma.zoomSubscription.findFirst({
    where: {
      userId: req.user.id,
      zoomLiveClassId,
      status: "CANCELLED",
    },
  });

  // Generate receipt ID
  const timestamp = Date.now().toString().slice(-8);
  const shortClassId = zoomLiveClassId.slice(0, 8);
  const shortUserId = req.user.id.slice(0, 8);
  const receipt = `zoom_reg_${shortClassId}_${shortUserId}_${timestamp}`;

  // Create Razorpay order for registration fee
  const options = {
    amount: Math.round(zoomLiveClass.registrationFee * 100),
    currency: "INR",
    receipt: receipt,
    notes: {
      userId: req.user.id,
      zoomLiveClassId,
      paymentType: "REGISTRATION",
      previousSubscriptionId: cancelledSubscription?.id || null,
    },
  };

  const order = await razorpay.orders.create(options);

  return res.status(200).json(
    new ApiResponsive(
      200,
      {
        order,
        zoomLiveClass,
        isRegistration: true,
        isReactivation: !!cancelledSubscription,
      },
      cancelledSubscription
        ? "Registration order created to reactivate your subscription"
        : "Registration order created successfully"
    )
  );
});

// User: Verify registration payment
export const verifyRegistrationPayment = asyncHandler(async (req, res) => {
  const {
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature,
    zoomLiveClassId,
  } = req.body;

  if (
    !razorpay_payment_id ||
    !razorpay_order_id ||
    !razorpay_signature ||
    !zoomLiveClassId
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // Verify signature
  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (generatedSignature !== razorpay_signature) {
    throw new ApiError(400, "Invalid payment signature");
  }

  // Get order details from Razorpay to check if this was a reactivation
  const order = await razorpay.orders.fetch(razorpay_order_id);
  const previousSubscriptionId = order.notes?.previousSubscriptionId || null;

  const zoomLiveClass = await prisma.zoomLiveClass.findUnique({
    where: { id: zoomLiveClassId },
  });

  if (!zoomLiveClass) {
    throw new ApiError(404, "Zoom live class not found");
  }

  // Calculate subscription end date (1 month from now)
  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 1);

  // Next payment date (1 month from now)
  const nextPaymentDate = new Date();
  nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

  // Generate receipt number
  const receiptNumber = `ZM-REG-${Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase()}`;

  // Create subscription and payment records in transaction
  try {
    const result = await prisma.$transaction(async (tx) => {
      let subscription;

      // If we have a previous subscription ID, update that one
      if (previousSubscriptionId) {
        subscription = await tx.zoomSubscription.update({
          where: { id: previousSubscriptionId },
          data: {
            startDate,
            endDate,
            nextPaymentDate,
            status: "PENDING_APPROVAL", // Set to pending approval so admin can review
            isRegistered: true,
            hasAccessToLinks: false, // Reset access until course fee is paid
            registrationPaymentId: razorpay_payment_id,
          },
        });
      } else {
        // Check if user already has any subscription (active or not)
        const existingSubscription = await tx.zoomSubscription.findFirst({
          where: {
            userId: req.user.id,
            zoomLiveClassId,
          },
        });

        if (existingSubscription) {
          // Update existing subscription
          subscription = await tx.zoomSubscription.update({
            where: { id: existingSubscription.id },
            data: {
              startDate,
              endDate,
              nextPaymentDate,
              status: "PENDING_APPROVAL", // Set to pending approval
              isRegistered: true,
              hasAccessToLinks: false,
              registrationPaymentId: razorpay_payment_id,
            },
          });
        } else {
          // Create new subscription
          subscription = await tx.zoomSubscription.create({
            data: {
              userId: req.user.id,
              zoomLiveClassId,
              startDate,
              endDate,
              nextPaymentDate,
              status: "PENDING_APPROVAL", // Set to pending approval
              isRegistered: true,
              hasAccessToLinks: false,
              registrationPaymentId: razorpay_payment_id,
            },
          });
        }
      }

      // Create payment record
      const payment = await tx.zoomPayment.create({
        data: {
          amount: zoomLiveClass.registrationFee,
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
          receiptNumber,
          status: "COMPLETED",
          paymentType: "REGISTRATION",
          userId: req.user.id,
          subscriptionId: subscription.id,
        },
      });

      return { subscription, payment };
    });

    // Send confirmation email
    try {
      await SendEmail({
        email: req.user.email,
        subject: "Registration Confirmed for Zoom Live Class",
        message: {
          name: req.user.name,
          title: zoomLiveClass.title,
          startTime: zoomLiveClass.startTime,
          amount: zoomLiveClass.registrationFee,
          receiptNumber: result.payment.receiptNumber,
          paymentId: result.payment.razorpay_payment_id,
          date: new Date(),
        },
        emailType: "ZOOM_REGISTRATION",
      });
    } catch (error) {
      console.error("Error sending email:", error);
    }

    return res
      .status(200)
      .json(
        new ApiResponsive(
          200,
          result,
          "Registration payment successful. You are now registered for this class."
        )
      );
  } catch (error) {
    throw new ApiError(500, error.message || "Payment processing failed");
  }
});

// User: Pay course access fee
export const payCourseAccess = asyncHandler(async (req, res) => {
  const { zoomLiveClassId, zoomSessionId } = req.body;

  console.log("payCourseAccess called with params:", {
    zoomLiveClassId,
    zoomSessionId,
    body: req.body,
  });

  // If zoomSessionId is provided but zoomLiveClassId is not, use zoomSessionId
  const classId = zoomLiveClassId || zoomSessionId;

  if (!classId) {
    throw new ApiError(400, "Zoom live class ID is required");
  }

  // Check if user already has a subscription
  const existingSubscription = await prisma.zoomSubscription.findFirst({
    where: {
      userId: req.user.id,
      zoomLiveClassId: classId,
      isRegistered: true,
    },
  });

  if (!existingSubscription) {
    throw new ApiError(400, "You must register for this class first");
  }

  // Check if the user's registration has been approved by admin
  if (!existingSubscription.isApproved) {
    throw new ApiError(
      403,
      "Your registration is pending approval from the administrator. Please wait for approval before paying the course fee."
    );
  }

  // Check if user already has access to the class
  if (existingSubscription.hasAccessToLinks) {
    return res.status(200).json(
      new ApiResponsive(
        200,
        {
          alreadyHasAccess: true,
          subscription: existingSubscription,
        },
        "You already have access to this class"
      )
    );
  }

  const zoomLiveClass = await prisma.zoomLiveClass.findUnique({
    where: { id: classId },
  });

  if (!zoomLiveClass) {
    throw new ApiError(404, "Zoom live class not found");
  }

  // Validate that the course fee is set
  if (zoomLiveClass.courseFee <= 0) {
    throw new ApiError(400, "Invalid course fee");
  }

  const timestamp = Date.now().toString().slice(-8);
  const shortClassId = classId.slice(0, 8);
  const shortUserId = req.user.id.slice(0, 8);
  const receipt = `zoom_access_${shortClassId}_${shortUserId}_${timestamp}`;

  // Create Razorpay order
  const options = {
    amount: Math.round(zoomLiveClass.courseFee * 100),
    currency: "INR",
    receipt: receipt,
    notes: {
      userId: req.user.id,
      zoomLiveClassId: classId,
      paymentType: "COURSE_ACCESS",
      subscriptionId: existingSubscription.id,
    },
  };

  const order = await razorpay.orders.create(options);

  return res.status(200).json(
    new ApiResponsive(
      200,
      {
        order,
        zoomLiveClass,
        isCourseAccess: true,
      },
      "Course access order created successfully"
    )
  );
});

// User: Verify course access payment
export const verifyCourseAccessPayment = asyncHandler(async (req, res) => {
  const {
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature,
    zoomLiveClassId,
    zoomSessionId,
  } = req.body;

  console.log("verifyCourseAccessPayment called with params:", {
    zoomLiveClassId,
    zoomSessionId,
    razorpay_payment_id,
    razorpay_order_id,
  });

  // Use zoomLiveClassId if provided, otherwise use zoomSessionId
  const classId = zoomLiveClassId || zoomSessionId;

  if (
    !razorpay_payment_id ||
    !razorpay_order_id ||
    !razorpay_signature ||
    !classId
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // Verify signature
  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (generatedSignature !== razorpay_signature) {
    throw new ApiError(400, "Invalid payment signature");
  }

  // Check if user is registered first
  const existingSubscription = await prisma.zoomSubscription.findFirst({
    where: {
      userId: req.user.id,
      zoomLiveClassId: classId,
      isRegistered: true,
    },
  });

  if (!existingSubscription) {
    throw new ApiError(400, "You must register for this class first");
  }

  const zoomLiveClass = await prisma.zoomLiveClass.findUnique({
    where: { id: classId },
    include: {
      modules: true,
    },
  });

  if (!zoomLiveClass) {
    throw new ApiError(404, "Zoom live class not found");
  }

  // Generate receipt number
  const receiptNumber = `ZM-ACCESS-${Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase()}`;

  // Update subscription and create payment records in transaction
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Update subscription to provide access
      const updatedSubscription = await tx.zoomSubscription.update({
        where: { id: existingSubscription.id },
        data: {
          status: "ACTIVE", // Ensure the status is active
          isApproved: true, // Ensure it's approved
          hasAccessToLinks: true, // Grant access to links
        },
      });

      // Create payment record
      const payment = await tx.zoomPayment.create({
        data: {
          amount: zoomLiveClass.courseFee,
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
          receiptNumber,
          status: "COMPLETED",
          paymentType: "COURSE_ACCESS",
          userId: req.user.id,
          subscriptionId: updatedSubscription.id,
        },
      });

      return { subscription: updatedSubscription, payment };
    });

    // Send confirmation email with the Zoom link details
    try {
      await SendEmail({
        email: req.user.email,
        subject: "Course Access Confirmed for Zoom Live Class",
        message: {
          name: req.user.name,
          title: zoomLiveClass.title,
          startDate: zoomLiveClass.startTime,
          meetingLink: zoomLiveClass.zoomLink,
          meetingId: zoomLiveClass.zoomMeetingId,
          password: zoomLiveClass.zoomPassword,
          amount: zoomLiveClass.courseFee,
          receiptNumber: result.payment.receiptNumber,
          paymentId: result.payment.razorpay_payment_id,
          date: new Date(),
        },
        emailType: "ZOOM_ACCESS",
      });
    } catch (error) {
      console.error("Error sending email:", error);
    }

    return res
      .status(200)
      .json(
        new ApiResponsive(
          200,
          result,
          "Course access payment successful. You can now access the class."
        )
      );
  } catch (error) {
    console.error("Error completing course access payment:", error);
    throw new ApiError(
      500,
      error.message || "Payment processing failed. Please contact support."
    );
  }
});

// User: Cancel subscription
export const cancelZoomSubscription = asyncHandler(async (req, res) => {
  const { subscriptionId } = req.params;

  const subscription = await prisma.zoomSubscription.findUnique({
    where: {
      id: subscriptionId,
      userId: req.user.id,
    },
    include: {
      zoomLiveClass: true,
    },
  });

  if (!subscription) {
    throw new ApiError(404, "Subscription not found");
  }

  // Only active subscriptions can be cancelled
  if (subscription.status !== "ACTIVE") {
    throw new ApiError(
      400,
      "This subscription is already cancelled or expired"
    );
  }

  // Update the subscription status to cancelled
  const updatedSubscription = await prisma.zoomSubscription.update({
    where: { id: subscriptionId },
    data: {
      status: "CANCELLED",
      isRegistered: false, // Reset registration status
      hasAccessToLinks: false, // Remove access to links
    },
  });

  // Send cancellation email notification
  try {
    await SendEmail({
      email: req.user.email,
      subject: "Your Zoom Live Class Subscription Has Been Cancelled",
      message: {
        name: req.user.name,
        title: subscription.zoomLiveClass.title,
        cancelDate: new Date().toLocaleDateString(),
      },
      emailType: "ZOOM_CANCELLATION",
    });
  } catch (error) {
    console.error("Error sending cancellation email:", error);
  }

  return res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        updatedSubscription,
        "Subscription cancelled successfully"
      )
    );
});

// Admin: Cancel subscription (by admin)
export const adminCancelZoomSubscription = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const subscription = await prisma.zoomSubscription.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      zoomLiveClass: true,
    },
  });

  if (!subscription) {
    throw new ApiError(404, "Subscription not found");
  }

  // Only active subscriptions can be cancelled
  if (subscription.status !== "ACTIVE") {
    throw new ApiError(
      400,
      "This subscription is already cancelled or expired"
    );
  }

  const updatedSubscription = await prisma.zoomSubscription.update({
    where: { id },
    data: {
      status: "CANCELLED",
      isRegistered: false, // Reset registration status
      hasAccessToLinks: false, // Remove access to links
    },
  });

  // Notify user about cancellation
  try {
    if (subscription.user && subscription.zoomLiveClass) {
      await SendEmail({
        email: subscription.user.email,
        subject:
          "Your Zoom Live Class Subscription Has Been Cancelled by Admin",
        message: {
          name: subscription.user.name,
          title: subscription.zoomLiveClass.title,
          cancelDate: new Date().toLocaleDateString(),
          adminCancelled: true,
        },
        emailType: "ZOOM_CANCELLATION",
      });
    }
  } catch (error) {
    console.error("Error sending cancellation email:", error);
  }

  return res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        updatedSubscription,
        "Subscription cancelled successfully"
      )
    );
});

// Check if user has access to a Zoom live class
export const checkZoomAccess = asyncHandler(async (req, res) => {
  const { zoomLiveClassId } = req.params;

  // Verify that the class exists
  const zoomLiveClass = await prisma.zoomLiveClass.findUnique({
    where: { id: zoomLiveClassId },
  });

  if (!zoomLiveClass) {
    throw new ApiError(404, "Zoom live class not found");
  }

  // Check if user has a subscription for this class
  const subscription = await prisma.zoomSubscription.findFirst({
    where: {
      userId: req.user.id,
      zoomLiveClassId,
    },
  });

  // Default response
  const response = {
    hasRegistered: false,
    hasPaidCourseFee: false,
    zoomDetails: null,
  };

  if (subscription) {
    response.hasRegistered = subscription.isRegistered;
    response.hasPaidCourseFee = subscription.hasAccessToLinks;

    // If user has paid course fee, include Zoom details
    if (subscription.hasAccessToLinks) {
      response.zoomDetails = {
        link: zoomLiveClass.zoomLink,
        meetingId: zoomLiveClass.zoomMeetingId,
        password: zoomLiveClass.zoomPassword,
      };
    }
  }

  return res
    .status(200)
    .json(
      new ApiResponsive(200, response, "Access status checked successfully")
    );
});

// Admin: Get all zoom payments
export const getAllZoomPayments = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const payments = await prisma.zoomPayment.findMany({
    skip,
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      subscription: {
        include: {
          zoomLiveClass: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
    },
  });

  const total = await prisma.zoomPayment.count();

  return res.status(200).json(
    new ApiResponsive(
      200,
      {
        payments,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
        },
      },
      "Zoom payments fetched successfully"
    )
  );
});

// Admin: Get zoom analytics
export const getZoomAnalytics = asyncHandler(async (req, res) => {
  // Get summary data for dashboard
  const totalClasses = await prisma.zoomLiveClass.count();
  const activeSubscriptions = await prisma.zoomSubscription.count({
    where: { status: "ACTIVE" },
  });

  // Get revenue data
  const payments = await prisma.zoomPayment.findMany({
    where: { status: "COMPLETED" },
    include: {
      subscription: {
        include: {
          zoomLiveClass: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
    },
  });

  const totalRevenue = payments.reduce(
    (sum, payment) => sum + payment.amount,
    0
  );

  // Monthly revenue analysis
  const monthlyRevenue = {};
  payments.forEach((payment) => {
    const month = new Date(payment.createdAt).toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
    monthlyRevenue[month] = (monthlyRevenue[month] || 0) + payment.amount;
  });

  // Recent payments
  const recentPayments = await prisma.zoomPayment.findMany({
    where: { status: "COMPLETED" },
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      subscription: {
        include: {
          zoomLiveClass: {
            select: {
              title: true,
            },
          },
        },
      },
    },
  });

  // Transform recentPayments to match the frontend expected structure
  const transformedRecentPayments = recentPayments.map((payment) => ({
    ...payment,
    subscription: {
      ...payment.subscription,
      zoomSession: {
        title: payment.subscription?.zoomLiveClass?.title || "Unknown Session",
      },
    },
  }));

  // Class popularity
  const classSubscriptions = await prisma.zoomLiveClass.findMany({
    include: {
      subscriptions: {
        where: { status: "ACTIVE" },
      },
    },
  });

  const classPopularity = classSubscriptions
    .map((liveClass) => ({
      id: liveClass.id,
      title: liveClass.title,
      subscriberCount: liveClass.subscriptions.length,
      isActive: liveClass.isActive,
    }))
    .sort((a, b) => b.subscriberCount - a.subscriberCount);

  return res.status(200).json(
    new ApiResponsive(
      200,
      {
        totalClasses,
        activeSubscriptions,
        totalRevenue,
        monthlyRevenue,
        recentPayments: transformedRecentPayments,
        sessionPopularity: classPopularity,
      },
      "Zoom analytics fetched successfully"
    )
  );
});

// Check if user has a subscription for a Zoom live class
export const checkSubscription = asyncHandler(async (req, res) => {
  const { zoomLiveClassId } = req.params;
  const { moduleId } = req.query;

  // Check if ID is undefined or invalid
  if (!zoomLiveClassId) {
    throw new ApiError(400, "Invalid or missing class ID/slug");
  }

  // Try to find by ID first
  const zoomLiveClass = await prisma.zoomLiveClass.findUnique({
    where: { id: zoomLiveClassId },
  });

  // If not found by ID, try to find by slug
  if (!zoomLiveClass) {
    const zoomLiveClassBySlug = await prisma.zoomLiveClass.findUnique({
      where: { slug: zoomLiveClassId },
    });

    if (!zoomLiveClassBySlug) {
      console.log(
        "Class not found by slug either. Invalid ID/slug:",
        zoomLiveClassId
      );
      throw new ApiError(404, "Zoom live class not found");
    }

    // Use the class found by slug
    const subscription = await prisma.zoomSubscription.findFirst({
      where: {
        userId: req.user.id,
        zoomLiveClassId: zoomLiveClassBySlug.id,
        ...(moduleId ? { moduleId } : {}),
      },
    });

    // Default response
    const responseData = {
      isSubscribed: false,
      isRegistered: false,
      isApproved: false,
      hasAccessToLinks: false,
      meetingDetails: null,
      courseFeeEnabled: zoomLiveClassBySlug.courseFeeEnabled,
    };

    if (subscription) {
      // User is registered if they have a subscription and have paid registration fee
      responseData.isRegistered = subscription.isRegistered || false;
      responseData.isSubscribed = subscription.status === "ACTIVE";
      responseData.isApproved = subscription.isApproved || false;

      // Determine access to links based on courseFeeEnabled flag
      if (!zoomLiveClassBySlug.courseFeeEnabled) {
        // If course fee is not enabled, grant access after registration
        responseData.hasAccessToLinks = subscription.isRegistered;
      } else {
        // If course fee is enabled, check if user has paid course fee
        responseData.hasAccessToLinks = subscription.hasAccessToLinks || false;
      }

      // If user has access, include Zoom details
      if (responseData.hasAccessToLinks) {
        responseData.meetingDetails = {
          link: zoomLiveClassBySlug.zoomLink,
          meetingId: zoomLiveClassBySlug.zoomMeetingId,
          password: zoomLiveClassBySlug.zoomPassword,
        };
      }
    }

    return res
      .status(200)
      .json(
        new ApiResponsive(
          200,
          responseData,
          "Subscription status checked successfully"
        )
      );
  }

  // Continue with the original logic for ID-based lookup
  const subscription = await prisma.zoomSubscription.findFirst({
    where: {
      userId: req.user.id,
      zoomLiveClassId,
      ...(moduleId ? { moduleId } : {}),
    },
  });

  // Default response
  const responseData = {
    isSubscribed: false,
    isRegistered: false,
    isApproved: false,
    hasAccessToLinks: false,
    meetingDetails: null,
    courseFeeEnabled: zoomLiveClass.courseFeeEnabled,
  };

  if (subscription) {
    // User is registered if they have a subscription and have paid registration fee
    responseData.isRegistered = subscription.isRegistered || false;
    responseData.isSubscribed = subscription.status === "ACTIVE";
    responseData.isApproved = subscription.isApproved || false;

    // Determine access to links based on courseFeeEnabled flag
    if (!zoomLiveClass.courseFeeEnabled) {
      // If course fee is not enabled, grant access after registration
      responseData.hasAccessToLinks = subscription.isRegistered;
    } else {
      // If course fee is enabled, check if user has paid course fee
      responseData.hasAccessToLinks = subscription.hasAccessToLinks || false;
    }

    // If user has access, include Zoom details
    if (responseData.hasAccessToLinks) {
      responseData.meetingDetails = {
        link: zoomLiveClass.zoomLink,
        meetingId: zoomLiveClass.zoomMeetingId,
        password: zoomLiveClass.zoomPassword,
      };
    }
  }

  return res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        responseData,
        "Subscription status checked successfully"
      )
    );
});

// Admin: Get all subscriptions
export const getAllZoomSubscriptions = asyncHandler(async (req, res) => {
  const subscriptions = await prisma.zoomSubscription.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      zoomLiveClass: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Transform the data to match the expected frontend structure
  const transformedSubscriptions = subscriptions.map((subscription) => ({
    ...subscription,
    zoomSession: {
      id: subscription.zoomLiveClass?.id,
      title: subscription.zoomLiveClass?.title || "Unknown Session",
    },
    zoomLiveClass: undefined,
  }));

  return res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        transformedSubscriptions,
        "All zoom subscriptions fetched successfully"
      )
    );
});

// Admin: Get pending approvals
export const getPendingApprovals = asyncHandler(async (req, res) => {
  // Get all subscriptions waiting for approval
  const pendingSubscriptions = await prisma.zoomSubscription.findMany({
    where: {
      status: "PENDING_APPROVAL",
      isRegistered: true, // Only get subscriptions where registration is paid
      registrationPaymentId: {
        not: null,
      }, // Only include subscriptions that have a payment ID
      zoomLiveClass: {
        courseFeeEnabled: true, // Only get subscriptions for classes where course fee is enabled
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      zoomLiveClass: {
        select: {
          id: true,
          title: true,
          currentRaga: true,
          currentOrientation: true,
          registrationFee: true,
          courseFee: true,
          startTime: true,
          courseFeeEnabled: true,
        },
      },
      payments: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
  });

  // Transform data to match expected front-end structure
  const transformedSubscriptions = pendingSubscriptions.map((sub) => ({
    ...sub,
    zoomSession: {
      id: sub.zoomLiveClass?.id,
      title: sub.zoomLiveClass?.title || "Unknown Session",
      currentRange: sub.zoomLiveClass?.currentRaga,
      currentOrientation: sub.zoomLiveClass?.currentOrientation,
      registrationFee: sub.zoomLiveClass?.registrationFee,
      courseFee: sub.zoomLiveClass?.courseFee,
      startTime: sub.zoomLiveClass?.startTime,
      courseFeeEnabled: sub.zoomLiveClass?.courseFeeEnabled,
    },
    zoomLiveClass: undefined,
  }));

  return res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        transformedSubscriptions,
        "Pending approval subscriptions fetched successfully"
      )
    );
});

// Admin: Approve subscription
export const approveZoomSubscription = asyncHandler(async (req, res) => {
  const { subscriptionId } = req.params;

  // Find the subscription
  const subscription = await prisma.zoomSubscription.findUnique({
    where: { id: subscriptionId },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      zoomLiveClass: true,
    },
  });

  if (!subscription) {
    throw new ApiError(404, "Subscription not found");
  }

  if (subscription.status !== "PENDING_APPROVAL") {
    throw new ApiError(
      400,
      "This subscription is not in pending approval state"
    );
  }

  // Update the subscription status
  const updatedSubscription = await prisma.zoomSubscription.update({
    where: { id: subscriptionId },
    data: {
      status: "ACTIVE",
      isApproved: true,
      // Note: We're not setting hasAccessToLinks to true here because
      // this is just for approving the registration, user still needs to pay course fee
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      zoomLiveClass: true,
    },
  });

  // Notify the user about the approval
  try {
    await SendEmail({
      email: subscription.user.email,
      subject: "Your Registration for Zoom Class Has Been Approved",
      message: {
        name: subscription.user.name,
        title: subscription.zoomLiveClass.title,
        date: new Date(
          subscription.zoomLiveClass.startTime
        ).toLocaleDateString(),
        time: new Date(subscription.zoomLiveClass.startTime).toLocaleTimeString(
          [],
          {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }
        ),
        courseFee: subscription.zoomLiveClass.courseFee,
        // Inform the user they need to pay the course fee to access links
        needsCourseFee:
          !subscription.hasAccessToLinks &&
          subscription.zoomLiveClass.courseFee > 0,
      },
      emailType: "ZOOM_APPROVAL",
    });
  } catch (error) {
    console.error("Error sending approval email:", error);
  }

  return res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        updatedSubscription,
        "Subscription approved successfully"
      )
    );
});

// Admin: Reject subscription
export const rejectZoomSubscription = asyncHandler(async (req, res) => {
  const { subscriptionId } = req.params;

  // Find the subscription
  const subscription = await prisma.zoomSubscription.findUnique({
    where: { id: subscriptionId },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      zoomLiveClass: true,
    },
  });

  if (!subscription) {
    throw new ApiError(404, "Subscription not found");
  }

  if (subscription.status !== "PENDING_APPROVAL") {
    throw new ApiError(
      400,
      "This subscription is not in pending approval state"
    );
  }

  // Update the subscription status
  const updatedSubscription = await prisma.zoomSubscription.update({
    where: { id: subscriptionId },
    data: {
      status: "REJECTED",
      isApproved: false,
    },
  });

  // Notify the user about the rejection
  try {
    await SendEmail({
      email: subscription.user.email,
      subject: "Your Registration for Zoom Class Has Been Rejected",
      message: {
        name: subscription.user.name,
        title: subscription.zoomLiveClass.title,
      },
      emailType: "ZOOM_REJECTION",
    });
  } catch (error) {
    console.error("Error sending rejection email:", error);
  }

  return res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        updatedSubscription,
        "Subscription rejected successfully"
      )
    );
});
