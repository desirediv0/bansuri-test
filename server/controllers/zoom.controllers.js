import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import axios from "axios";
import { razorpay } from "../app.js";
import crypto from "crypto";
import { SendEmail } from "../email/SendEmail.js";
import { deleteFromS3 } from "../utils/deleteFromS3.js";

// Function to get Zoom access token
const getZoomAccessToken = async () => {
  try {
    const accountId = process.env.ZOOM_ACCOUNT_ID;
    const clientId = process.env.ZOOM_CLIENT_ID;
    const clientSecret = process.env.ZOOM_CLIENT_SECRET;

    const authBuffer = Buffer.from(`${clientId}:${clientSecret}`).toString(
      "base64"
    );

    const response = await axios.post(
      "https://zoom.us/oauth/token",
      new URLSearchParams({
        grant_type: "account_credentials",
        account_id: accountId,
      }),
      {
        headers: {
          Authorization: `Basic ${authBuffer}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    return response.data.access_token;
  } catch (error) {
    console.error("Error getting Zoom access token:", error);
    throw new ApiError(500, "Failed to get Zoom access token");
  }
};

// Create Zoom meeting
const createZoomMeeting = async (meetingData) => {
  try {
    const token = await getZoomAccessToken();

    const response = await axios.post(
      "https://api.zoom.us/v2/users/me/meetings",
      {
        topic: meetingData.title,
        type: 2, // Scheduled meeting
        start_time: meetingData.startTime,
        duration: Math.ceil(
          (new Date(meetingData.endTime) - new Date(meetingData.startTime)) /
            (60 * 1000)
        ),
        timezone: "Asia/Kolkata",
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: false,
          mute_upon_entry: true,
          waiting_room: true,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return {
      zoomMeetingId: String(response.data.id),
      zoomLink: response.data.join_url,
      zoomPassword: response.data.password,
    };
  } catch (error) {
    console.error("Error creating Zoom meeting:", error);
    throw new ApiError(500, "Failed to create Zoom meeting");
  }
};

// Admin: Create a new Zoom class
export const createZoomSession = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    startTime,
    endTime,
    price,
    registrationFee,
    courseFee,
    capacity,
    recurringClass,
    thumbnailUrl,
    hasModules,
    isFirstModuleFree,
    modules,
    currentRange,
    currentOrientation,
    isActive,
  } = req.body;

  if (!title || !startTime || !endTime) {
    // If thumbnail was uploaded but there's an error, delete it from S3
    if (thumbnailUrl) {
      try {
        await deleteFromS3(thumbnailUrl);
      } catch (err) {
        console.error(
          "Error deleting thumbnail after class creation failed:",
          err
        );
      }
    }
    throw new ApiError(400, "Please provide all required fields");
  }

  try {
    // Create Zoom meeting
    const zoomData = await createZoomMeeting({
      title,
      startTime,
      endTime,
    });

    // Initialize base data with required fields
    const zoomClassData = {
      title,
      description,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      price: parseFloat(price || 0),
      userId: req.user.id,
      zoomLink: zoomData.zoomLink,
      zoomMeetingId: zoomData.zoomMeetingId,
      zoomPassword: zoomData.zoomPassword,
    };

    // Conditionally add fields that might cause errors if not in the schema
    try {
      // Try to add newer fields, but don't fail if they don't exist in schema
      if (registrationFee !== undefined) {
        zoomClassData.registrationFee = parseFloat(registrationFee || 0);
      }

      if (courseFee !== undefined) {
        zoomClassData.courseFee = parseFloat(courseFee || 0);
      }

      if (hasModules !== undefined) {
        zoomClassData.hasModules = hasModules || false;
      }

      if (isFirstModuleFree !== undefined) {
        zoomClassData.isFirstModuleFree = isFirstModuleFree || false;
      }

      if (currentRange !== undefined) {
        zoomClassData.currentRange = currentRange || null;
      }

      if (currentOrientation !== undefined) {
        zoomClassData.currentOrientation = currentOrientation || null;
      }

      if (isActive !== undefined) {
        zoomClassData.isActive = isActive;
      }

      if (recurringClass !== undefined) {
        zoomClassData.recurringClass = recurringClass;
      }

      if (thumbnailUrl) {
        zoomClassData.thumbnailUrl = thumbnailUrl;
      }

      if (capacity !== undefined && capacity !== null) {
        zoomClassData.capacity = parseInt(capacity);
      }
    } catch (err) {
      console.log(
        "Some fields might not exist in the schema yet:",
        err.message
      );
    }

    // Use a transaction to create the Zoom class and modules
    const zoomClass = await prisma.$transaction(async (tx) => {
      // Create the main zoom class
      const classData = await tx.zoomSession.create({
        data: zoomClassData,
      });

      // If modules are provided, create them
      if (
        hasModules &&
        modules &&
        Array.isArray(modules) &&
        modules.length > 0
      ) {
        // Create each module
        for (let i = 0; i < modules.length; i++) {
          const module = modules[i];

          // Create a separate Zoom meeting for each module
          const moduleZoomData = await createZoomMeeting({
            title: `${title} - ${module.title}`,
            startTime: module.startTime,
            endTime: module.endTime,
          });

          await tx.zoomSessionModule.create({
            data: {
              title: module.title,
              description: module.description,
              startTime: new Date(module.startTime),
              endTime: new Date(module.endTime),
              zoomLink: moduleZoomData.zoomLink,
              zoomMeetingId: moduleZoomData.zoomMeetingId,
              zoomPassword: moduleZoomData.zoomPassword,
              position: i + 1,
              isFree: isFirstModuleFree && i === 0, // First module is free if isFirstModuleFree is true
              zoomSessionId: classData.id,
            },
          });
        }
      }

      return classData;
    });

    return res
      .status(201)
      .json(
        new ApiResponsive(201, zoomClass, "Zoom class created successfully")
      );
  } catch (error) {
    // If the class creation fails but thumbnail was uploaded, delete the uploaded image
    if (thumbnailUrl) {
      try {
        await deleteFromS3(thumbnailUrl);
      } catch (err) {
        console.error(
          "Error deleting thumbnail after class creation failed:",
          err
        );
      }
    }
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Failed to create Zoom class"
    );
  }
});

// Admin: Get all Zoom classes
export const getAllZoomSessions = asyncHandler(async (req, res) => {
  // For admin users, return all zoom class data including sensitive fields
  const zoomClasses = await prisma.zoomSession.findMany({
    orderBy: {
      startTime: "desc",
    },
    include: {
      subscribedUsers: {
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  // For admins, we return the full data including zoom details
  return res
    .status(200)
    .json(
      new ApiResponsive(200, zoomClasses, "Zoom classes fetched successfully")
    );
});

// Admin: Update Zoom class
export const updateZoomSession = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    startTime,
    endTime,
    price,
    isActive,
    thumbnailUrl,
  } = req.body;

  const zoomClass = await prisma.zoomSession.findUnique({
    where: { id },
  });

  if (!zoomClass) {
    // If thumbnail was uploaded but class doesn't exist, delete it from S3
    if (thumbnailUrl && thumbnailUrl !== zoomClass?.thumbnailUrl) {
      try {
        await deleteFromS3(thumbnailUrl);
      } catch (err) {
        console.error("Error deleting thumbnail after update failed:", err);
      }
    }
    throw new ApiError(404, "Zoom class not found");
  }

  const updatedFields = {};
  if (title !== undefined) updatedFields.title = title;
  if (description !== undefined) updatedFields.description = description;
  if (startTime !== undefined) updatedFields.startTime = new Date(startTime);
  if (endTime !== undefined) updatedFields.endTime = new Date(endTime);
  if (price !== undefined) updatedFields.price = parseFloat(price);
  if (isActive !== undefined) updatedFields.isActive = isActive;

  // Handle thumbnail update
  if (thumbnailUrl !== undefined) {
    // If the thumbnail URL has changed, delete the old one from S3
    if (zoomClass.thumbnailUrl && thumbnailUrl !== zoomClass.thumbnailUrl) {
      try {
        await deleteFromS3(zoomClass.thumbnailUrl);
      } catch (err) {
        console.error("Error deleting old thumbnail:", err);
      }
    }
    updatedFields.thumbnailUrl = thumbnailUrl;
  }

  try {
    const updatedClass = await prisma.zoomSession.update({
      where: { id },
      data: updatedFields,
    });

    return res
      .status(200)
      .json(
        new ApiResponsive(200, updatedClass, "Zoom class updated successfully")
      );
  } catch (error) {
    // If update fails and we uploaded a new thumbnail, delete it
    if (thumbnailUrl && thumbnailUrl !== zoomClass.thumbnailUrl) {
      try {
        await deleteFromS3(thumbnailUrl);
      } catch (err) {
        console.error("Error deleting thumbnail after update failed:", err);
      }
    }
    throw new ApiError(500, "Failed to update Zoom class");
  }
});

// Admin: Delete Zoom class
export const deleteZoomSession = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const zoomClass = await prisma.zoomSession.findUnique({
    where: { id },
    include: {
      subscribedUsers: true,
    },
  });

  if (!zoomClass) {
    throw new ApiError(404, "Zoom class not found");
  }

  // Delete the Zoom class and related records in a transaction
  try {
    await prisma.$transaction(async (tx) => {
      // 1. First, find all subscriptions for this class
      const subscriptions = await tx.zoomSubscription.findMany({
        where: { zoomSessionId: id },
        select: { id: true },
      });

      // 2. Get all subscription IDs
      const subscriptionIds = subscriptions.map((sub) => sub.id);

      // 3. Delete all related payments first
      if (subscriptionIds.length > 0) {
        await tx.zoomPayment.deleteMany({
          where: {
            subscriptionId: {
              in: subscriptionIds,
            },
          },
        });
      }
      await tx.zoomSubscription.deleteMany({
        where: { zoomSessionId: id },
      });

      await tx.zoomSession.delete({
        where: { id },
      });
    });

    if (zoomClass.thumbnailUrl) {
      await deleteFromS3(zoomClass.thumbnailUrl);
    }

    return res
      .status(200)
      .json(new ApiResponsive(200, null, "Zoom class deleted successfully"));
  } catch (error) {
    console.error("Error deleting zoom class:", error);
    throw new ApiError(500, "Failed to delete Zoom class");
  }
});

// User: Get available Zoom classes
export const getUserZoomSessions = asyncHandler(async (req, res) => {
  // If includeAll is true, get all classes regardless of status/date
  let zoomClasses;
  if (req.query.includeAll === "true") {
    zoomClasses = await prisma.zoomSession.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        startTime: "desc",
      },
      include: {
        subscribedUsers: {
          ...(req.user
            ? {
                where: {
                  userId: req.user.id,
                },
              }
            : {}),
        },
        createdBy: {
          select: {
            name: true,
          },
        },
      },
    });
  } else {
    // Get only active classes (removed date filter)
    zoomClasses = await prisma.zoomSession.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        startTime: "asc",
      },
      include: {
        subscribedUsers: {
          ...(req.user
            ? {
                where: {
                  userId: req.user.id,
                },
              }
            : {}),
        },
        createdBy: {
          select: {
            name: true,
          },
        },
      },
    });
  }

  // Process each class to add formatted data and remove sensitive information
  const processedClasses = zoomClasses.map((classData) => {
    // Check if user has access to links
    let isRegistered = false;
    let hasAccessToLinks = false;

    if (req.user && classData.subscribedUsers?.length > 0) {
      const subscription = classData.subscribedUsers[0];
      isRegistered = subscription.isRegistered || false;
      hasAccessToLinks = subscription.hasAccessToLinks || false;
    }

    // Create a copy of the class data
    const classInfo = { ...classData };

    // Remove sensitive zoom details unless user has access
    if (!req.user || !hasAccessToLinks) {
      delete classInfo.zoomLink;
      delete classInfo.zoomMeetingId;
      delete classInfo.zoomPassword;
    }

    // Return transformed class
    return {
      ...classInfo,
      isSubscribed: req.user ? classData.subscribedUsers?.length > 0 : false,
      isRegistered,
      hasAccessToLinks,
      teacherName: classData.createdBy?.name || "Instructor",
      formattedDate: new Date(classData.startTime).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      formattedTime: new Date(classData.startTime).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      duration: Math.ceil(
        (new Date(classData.endTime) - new Date(classData.startTime)) /
          (60 * 1000)
      ),
      subscribedUsers: undefined,
      createdBy: undefined,
    };
  });

  // Create appropriate message based on the request type
  const message =
    req.query.includeAll === "true"
      ? "All zoom classes fetched"
      : "Zoom classes fetched successfully";

  return res
    .status(200)
    .json(new ApiResponsive(200, processedClasses, message));
});

// User: Get my subscribed Zoom classes
export const getMyZoomSubscriptions = asyncHandler(async (req, res) => {
  const subscriptions = await prisma.zoomSubscription.findMany({
    where: {
      userId: req.user.id,
      status: "ACTIVE",
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
    zoomLiveClass: undefined, // Remove the original object to avoid duplication
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
});

// User: Subscribe to a Zoom class (create Razorpay order)
export const createZoomSubscription = asyncHandler(async (req, res) => {
  const { zoomSessionId } = req.body;

  const zoomClass = await prisma.zoomSession.findUnique({
    where: { id: zoomSessionId },
  });

  if (!zoomClass) {
    throw new ApiError(404, "Zoom class not found");
  }

  if (!zoomClass.isActive) {
    throw new ApiError(400, "This Zoom class is not active");
  }

  // Check if user already has an active subscription
  const existingActiveSubscription = await prisma.zoomSubscription.findFirst({
    where: {
      userId: req.user.id,
      zoomSessionId,
      status: "ACTIVE",
    },
  });

  if (existingActiveSubscription) {
    // Return success instead of throwing an error
    return res.status(200).json(
      new ApiResponsive(
        200,
        {
          order: null,
          zoomClass,
          isRenewal: false,
          alreadySubscribed: true,
          subscription: existingActiveSubscription,
        },
        "You are already subscribed to this class"
      )
    );
  }

  // Check if the user had previously subscribed and canceled
  const existingCanceledSubscription = await prisma.zoomSubscription.findFirst({
    where: {
      userId: req.user.id,
      zoomSessionId,
      status: {
        in: ["CANCELLED", "EXPIRED"],
      },
    },
  });

  const timestamp = Date.now().toString().slice(-8);
  const shortSessionId = zoomSessionId.slice(0, 8);
  const shortUserId = req.user.id.slice(0, 8);
  const receipt = `zoom_${shortSessionId}_${shortUserId}_${timestamp}`;

  // Create Razorpay order
  const options = {
    amount: Math.round(zoomClass.price * 100),
    currency: "INR",
    receipt: receipt,
    notes: {
      userId: req.user.id,
      zoomSessionId,
      subscriptionType: existingCanceledSubscription ? "renewal" : "new",
      previousSubscriptionId: existingCanceledSubscription?.id || null,
    },
  };

  const order = await razorpay.orders.create(options);

  return res.status(200).json(
    new ApiResponsive(
      200,
      {
        order,
        zoomClass,
        isRenewal: !!existingCanceledSubscription,
        previousSubscriptionId: existingCanceledSubscription?.id || null,
      },
      "Order created successfully"
    )
  );
});

// User: Verify Zoom subscription payment
export const verifyZoomPayment = asyncHandler(async (req, res) => {
  const {
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature,
    zoomSessionId,
    moduleId,
    previousSubscriptionId,
  } = req.body;

  if (
    !razorpay_payment_id ||
    !razorpay_order_id ||
    !razorpay_signature ||
    !zoomSessionId
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

  const zoomClass = await prisma.zoomSession.findUnique({
    where: { id: zoomSessionId },
    include: {
      modules: { orderBy: { position: "asc" } },
    },
  });

  if (!zoomClass) {
    throw new ApiError(404, "Zoom class not found");
  }

  // Calculate subscription end date (1 month from now)
  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 1);

  // Next payment date (1 month from now)
  const nextPaymentDate = new Date();
  nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

  // Generate receipt number
  const receiptNumber = `ZM-${Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase()}`;

  // Check if this is a module-specific subscription
  const targetModuleId =
    moduleId ||
    (zoomClass.hasModules && zoomClass.modules.length > 0
      ? zoomClass.modules[0].id
      : null);

  // Check if the module is free
  let isModuleFree = false;
  let targetModule = null;

  if (targetModuleId) {
    targetModule = zoomClass.modules.find((m) => m.id === targetModuleId);
    if (targetModule) {
      isModuleFree = targetModule.isFree;
    }
  }

  // Determine initial status based on whether approval is needed
  // Free modules don't need approval, paid modules do
  const initialStatus = isModuleFree ? "ACTIVE" : "PENDING_APPROVAL";
  const initialApprovalStatus = isModuleFree;

  // Create subscription and payment records in transaction
  try {
    const result = await prisma.$transaction(async (tx) => {
      // First, find any existing subscription regardless of status
      const existingSubscription = await tx.zoomSubscription.findFirst({
        where: {
          userId: req.user.id,
          zoomSessionId,
          ...(targetModuleId ? { moduleId: targetModuleId } : {}),
        },
      });

      let subscription;

      if (existingSubscription) {
        // Update existing subscription
        subscription = await tx.zoomSubscription.update({
          where: { id: existingSubscription.id },
          data: {
            startDate,
            endDate,
            nextPaymentDate,
            status: initialStatus,
            isApproved: initialApprovalStatus,
            moduleId: targetModuleId,
          },
        });
      } else {
        // Create new subscription
        subscription = await tx.zoomSubscription.create({
          data: {
            userId: req.user.id,
            zoomSessionId,
            startDate,
            endDate,
            nextPaymentDate,
            status: initialStatus,
            isApproved: initialApprovalStatus,
            moduleId: targetModuleId,
          },
        });
      }

      // Create payment record
      const payment = await tx.zoomPayment.create({
        data: {
          amount: isModuleFree ? 0 : zoomClass.price,
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
          receiptNumber,
          status: "COMPLETED",
          userId: req.user.id,
          subscriptionId: subscription.id,
        },
      });

      return { subscription, payment, isModuleFree };
    });

    // Send confirmation email
    try {
      await SendEmail({
        email: req.user.email,
        subject: "Zoom Class Subscription Confirmed",
        message: {
          name: req.user.name,
          title: zoomClass.title,
          startDate: zoomClass.startTime,
          meetingLink: result.isModuleFree ? zoomClass.zoomLink : null,
          password: result.isModuleFree ? zoomClass.zoomPassword : null,
          amount: result.isModuleFree ? 0 : zoomClass.price,
          receiptNumber: result.payment.receiptNumber,
          paymentId: result.payment.razorpay_payment_id,
          date: new Date(),
          needsApproval: !result.isModuleFree,
        },
        emailType: "ZOOM_SUBSCRIPTION",
      });
    } catch (error) {
      console.error("Error sending email:", error);
    }

    return res.status(200).json(
      new ApiResponsive(
        200,
        {
          ...result,
          message: result.isModuleFree
            ? "Payment successful and subscription activated"
            : "Payment successful. Waiting for admin approval.",
        },
        result.isModuleFree
          ? "Payment successful and subscription activated"
          : "Payment successful. Waiting for admin approval."
      )
    );
  } catch (error) {
    console.error("Error completing payment process:", error);

    if (
      error.code === "P2002" &&
      error.meta?.target?.includes("userId") &&
      error.meta?.target?.includes("zoomSessionId")
    ) {
      try {
        const existingSubscription = await prisma.zoomSubscription.findFirst({
          where: {
            userId: req.user.id,
            zoomSessionId,
            ...(targetModuleId ? { moduleId: targetModuleId } : {}),
          },
        });

        if (existingSubscription) {
          const updatedSubscription = await prisma.zoomSubscription.update({
            where: { id: existingSubscription.id },
            data: {
              startDate,
              endDate,
              nextPaymentDate,
              status: initialStatus,
              isApproved: initialApprovalStatus,
              moduleId: targetModuleId,
            },
          });

          const payment = await prisma.zoomPayment.create({
            data: {
              amount: isModuleFree ? 0 : zoomClass.price,
              razorpay_order_id,
              razorpay_payment_id,
              razorpay_signature,
              receiptNumber,
              status: "COMPLETED",
              userId: req.user.id,
              subscriptionId: updatedSubscription.id,
            },
          });

          return res.status(200).json(
            new ApiResponsive(
              200,
              {
                subscription: updatedSubscription,
                payment,
                isModuleFree,
                message: isModuleFree
                  ? "Payment successful and subscription reactivated"
                  : "Payment successful. Waiting for admin approval.",
              },
              isModuleFree
                ? "Payment successful and subscription reactivated"
                : "Payment successful. Waiting for admin approval."
            )
          );
        }
      } catch (secondError) {
        console.error("Error in fallback approach:", secondError);
      }
    }

    throw new ApiError(
      500,
      "Failed to process payment. Please contact support."
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
      zoomSession: true,
    },
  });

  if (!subscription) {
    throw new ApiError(404, "Subscription not found");
  }

  // Only active, pending approval, or registered subscriptions can be cancelled
  if (
    !["ACTIVE", "PENDING_APPROVAL", "REGISTERED"].includes(subscription.status)
  ) {
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
      subject: "Your Zoom Class Subscription Has Been Cancelled",
      message: {
        name: req.user.name,
        title: subscription.zoomSession.title,
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

// Check if user has active subscription for a Zoom class
export const checkZoomSubscription = asyncHandler(async (req, res) => {
  const { zoomSessionId } = req.params;
  const { moduleId } = req.query;

  // Check for all possible modules in this class
  const zoomClass = await prisma.zoomLiveClass.findUnique({
    where: { id: zoomSessionId },
    include: {
      modules: { orderBy: { position: "asc" } },
    },
  });

  if (!zoomClass) {
    throw new ApiError(404, "Zoom class not found");
  }

  // If moduleId is specified, check for that specific module
  // Otherwise check for any module or main class
  const whereClause = {
    userId: req.user.id,
    zoomLiveClassId: zoomSessionId,
    ...(moduleId ? { moduleId } : {}),
  };

  // First check for an active and approved subscription
  const activeSubscription = await prisma.zoomSubscription.findFirst({
    where: {
      ...whereClause,
      status: "ACTIVE",
      isApproved: true,
      endDate: {
        gte: new Date(),
      },
    },
    include: {
      zoomLiveClass: true,
      module: true,
    },
  });

  // If there's an active and approved subscription, return it
  if (activeSubscription) {
    // Determine which link to return - module link or main class link
    const meetingLink = activeSubscription.module
      ? activeSubscription.module.zoomLink
      : activeSubscription.zoomLiveClass.zoomLink;

    const meetingPassword = activeSubscription.module
      ? activeSubscription.module.zoomPassword
      : activeSubscription.zoomLiveClass.zoomPassword;

    const meetingId = activeSubscription.module
      ? activeSubscription.module.zoomMeetingId
      : activeSubscription.zoomLiveClass.zoomMeetingId;

    return res.status(200).json(
      new ApiResponsive(
        200,
        {
          isSubscribed: true,
          subscription: activeSubscription,
          meetingDetails: {
            link: meetingLink,
            password: meetingPassword,
            meetingId: meetingId,
          },
        },
        "Active subscription found"
      )
    );
  }

  // Check for a pending approval subscription
  const pendingSubscription = await prisma.zoomSubscription.findFirst({
    where: {
      ...whereClause,
      status: "PENDING_APPROVAL",
    },
    include: {
      zoomLiveClass: true,
      module: true,
    },
  });

  if (pendingSubscription) {
    return res.status(200).json(
      new ApiResponsive(
        200,
        {
          isSubscribed: false,
          isPending: true,
          subscription: pendingSubscription,
        },
        "Subscription is pending approval"
      )
    );
  }

  // Check for free modules
  if (zoomClass.hasModules) {
    const freeModules = zoomClass.modules.filter((m) => m.isFree);

    if (freeModules.length > 0) {
      // For free modules, we automatically create a subscription for the user
      // or return existing one
      const freeModule = freeModules[0]; // Usually the first module

      // Check if already has a subscription for this free module
      const existingFreeSubscription = await prisma.zoomSubscription.findFirst({
        where: {
          userId: req.user.id,
          zoomLiveClassId: zoomSessionId,
          moduleId: freeModule.id,
        },
        include: {
          module: true,
        },
      });

      if (existingFreeSubscription) {
        return res.status(200).json(
          new ApiResponsive(
            200,
            {
              isSubscribed: true,
              isFreeModule: true,
              subscription: existingFreeSubscription,
              meetingDetails: {
                link: freeModule.zoomLink,
                password: freeModule.zoomPassword,
                meetingId: freeModule.zoomMeetingId,
              },
            },
            "Free module subscription found"
          )
        );
      } else {
        // Create a free subscription for this user
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1);
        const nextPaymentDate = new Date();
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

        const freeSubscription = await prisma.zoomSubscription.create({
          data: {
            userId: req.user.id,
            zoomLiveClassId: zoomSessionId,
            moduleId: freeModule.id,
            startDate,
            endDate,
            nextPaymentDate,
            status: "ACTIVE",
            isApproved: true,
          },
          include: {
            module: true,
          },
        });

        return res.status(200).json(
          new ApiResponsive(
            200,
            {
              isSubscribed: true,
              isFreeModule: true,
              subscription: freeSubscription,
              meetingDetails: {
                link: freeModule.zoomLink,
                password: freeModule.zoomPassword,
                meetingId: freeModule.zoomMeetingId,
              },
            },
            "Free module subscription created"
          )
        );
      }
    }
  }

  // If no active subscription, check if the user has any subscription that might need reactivation
  const inactiveSubscription = await prisma.zoomSubscription.findFirst({
    where: whereClause,
    include: {
      zoomLiveClass: true,
      module: true,
    },
  });

  // If user has a payment history for this class, activate the subscription
  if (inactiveSubscription) {
    // Reactivate the subscription
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);
    const nextPaymentDate = new Date();
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

    let isModuleFree = false;
    if (inactiveSubscription.moduleId) {
      const module = zoomClass.modules.find(
        (m) => m.id === inactiveSubscription.moduleId
      );
      if (module) {
        isModuleFree = module.isFree;
      }
    }

    const updatedSubscription = await prisma.zoomSubscription.update({
      where: { id: inactiveSubscription.id },
      data: {
        status: isModuleFree ? "ACTIVE" : "PENDING_APPROVAL",
        isApproved: isModuleFree,
        startDate,
        endDate,
        nextPaymentDate,
      },
      include: {
        zoomLiveClass: true,
        module: true,
      },
    });

    // Only return meeting details if it's approved (free module)
    if (isModuleFree) {
      // Determine which link to return - module link or main session link
      const meetingLink = updatedSubscription.module
        ? updatedSubscription.module.zoomLink
        : updatedSubscription.zoomLiveClass.zoomLink;

      const meetingPassword = updatedSubscription.module
        ? updatedSubscription.module.zoomPassword
        : updatedSubscription.zoomLiveClass.zoomPassword;

      const meetingId = updatedSubscription.module
        ? updatedSubscription.module.zoomMeetingId
        : updatedSubscription.zoomLiveClass.zoomMeetingId;

      return res.status(200).json(
        new ApiResponsive(
          200,
          {
            isSubscribed: true,
            subscription: updatedSubscription,
            meetingDetails: {
              link: meetingLink,
              password: meetingPassword,
              meetingId: meetingId,
            },
            reactivated: true,
          },
          "Subscription reactivated"
        )
      );
    } else {
      return res.status(200).json(
        new ApiResponsive(
          200,
          {
            isSubscribed: false,
            isPending: true,
            subscription: updatedSubscription,
            reactivated: true,
          },
          "Subscription reactivated and pending approval"
        )
      );
    }
  }

  // No subscription found
  return res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        { isSubscribed: false },
        "Not subscribed to this session"
      )
    );
});

// Admin: Generate Zoom attendance report
export const getZoomSessionAttendees = asyncHandler(async (req, res) => {
  const { zoomSessionId } = req.params;

  const zoomSession = await prisma.zoomSession.findUnique({
    where: { id: zoomSessionId },
    include: {
      subscribedUsers: {
        where: {
          status: "ACTIVE",
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          payments: {
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
          },
        },
      },
    },
  });

  if (!zoomSession) {
    throw new ApiError(404, "Zoom session not found");
  }

  const attendees = zoomSession.subscribedUsers.map((sub) => ({
    userId: sub.user.id,
    name: sub.user.name,
    email: sub.user.email,
    subscriptionId: sub.id,
    subscriptionStatus: sub.status,
    lastPayment: sub.payments[0] || null,
    nextPaymentDue: sub.nextPaymentDate,
  }));

  return res.status(200).json(
    new ApiResponsive(
      200,
      {
        zoomSession,
        attendees,
        totalAttendees: attendees.length,
      },
      "Attendees fetched successfully"
    )
  );
});

// Admin: Send Zoom meeting reminder to all subscribers
export const sendMeetingReminders = asyncHandler(async (req, res) => {
  const { zoomSessionId } = req.params;

  const zoomSession = await prisma.zoomSession.findUnique({
    where: { id: zoomSessionId },
    include: {
      subscribedUsers: {
        where: {
          status: "ACTIVE",
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!zoomSession) {
    throw new ApiError(404, "Zoom session not found");
  }

  const emailPromises = zoomSession.subscribedUsers.map((sub) => {
    return SendEmail({
      email: sub.user.email,
      subject: `Reminder: ${zoomSession.title} starts soon`,
      message: {
        name: sub.user.name,
        title: zoomSession.title,
        startTime: zoomSession.startTime,
        meetingLink: zoomSession.zoomLink,
        password: zoomSession.zoomPassword,
      },
      emailType: "ZOOM_REMINDER",
    });
  });

  await Promise.all(emailPromises);

  return res.status(200).json(
    new ApiResponsive(
      200,
      {
        remindersSent: zoomSession.subscribedUsers.length,
      },
      "Meeting reminders sent successfully"
    )
  );
});

// Process monthly subscription renewals (could be called by a cron job)
export const processZoomRenewals = asyncHandler(async (req, res) => {
  const today = new Date();

  // Find subscriptions due for renewal
  const dueSubscriptions = await prisma.zoomSubscription.findMany({
    where: {
      status: "ACTIVE",
      nextPaymentDate: {
        lte: today,
      },
    },
    include: {
      user: true,
      zoomSession: true,
    },
  });

  const results = {
    processed: 0,
    failed: 0,
    details: [],
  };

  // Process each subscription
  for (const subscription of dueSubscriptions) {
    try {
      // Here you would typically:
      // 1. Charge the customer via Razorpay
      // 2. Update subscription dates

      // For now, we'll just mark them as expired
      await prisma.zoomSubscription.update({
        where: { id: subscription.id },
        data: {
          status: "EXPIRED",
          endDate: today,
        },
      });

      results.processed++;
      results.details.push({
        subscriptionId: subscription.id,
        status: "expired",
        user: subscription.user.email,
        session: subscription.zoomSession.title,
      });

      // Send notification about expiry
      await SendEmail({
        email: subscription.user.email,
        subject: "Your Zoom Class Subscription Has Expired",
        message: {
          name: subscription.user.name,
          title: subscription.zoomSession.title,
        },
        emailType: "ZOOM_EXPIRY",
      });
    } catch (error) {
      results.failed++;
      results.details.push({
        subscriptionId: subscription.id,
        status: "failed",
        error: error.message,
      });
    }
  }

  return res
    .status(200)
    .json(new ApiResponsive(200, results, "Subscription renewals processed"));
});

// Admin: Get all payments
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
          zoomSession: {
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
  const totalSessions = await prisma.zoomSession.count();
  const activeSubscriptions = await prisma.zoomSubscription.count({
    where: { status: "ACTIVE" },
  });

  // Get revenue data
  const payments = await prisma.zoomPayment.findMany({
    where: { status: "COMPLETED" },
    include: {
      subscription: {
        include: {
          zoomSession: true,
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
          zoomSession: {
            select: {
              title: true,
            },
          },
        },
      },
    },
  });

  // Session popularity
  const sessionSubscriptions = await prisma.zoomSession.findMany({
    include: {
      subscribedUsers: {
        where: { status: "ACTIVE" },
      },
    },
  });

  const sessionPopularity = sessionSubscriptions
    .map((session) => ({
      id: session.id,
      title: session.title,
      subscriberCount: session.subscribedUsers.length,
      isActive: session.isActive,
    }))
    .sort((a, b) => b.subscriberCount - a.subscriberCount);

  return res.status(200).json(
    new ApiResponsive(
      200,
      {
        totalSessions,
        activeSubscriptions,
        totalRevenue,
        monthlyRevenue,
        recentPayments,
        sessionPopularity,
      },
      "Zoom analytics fetched successfully"
    )
  );
});

// Generate Zoom payment receipt
export const generateZoomReceipt = asyncHandler(async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await prisma.zoomPayment.findUnique({
      where: { id: paymentId },
      include: {
        user: true,
        subscription: {
          include: {
            zoomSession: true,
          },
        },
      },
    });

    if (!payment) {
      throw new ApiError(404, "Payment not found");
    }

    // Check if user has permission
    if (payment.userId !== req.user.id && req.user.role !== "ADMIN") {
      throw new ApiError(
        403,
        "You don't have permission to access this receipt"
      );
    }

    // Here you would typically generate a PDF
    // For now, we'll just return payment details
    return res.status(200).json(
      new ApiResponsive(
        200,
        {
          receiptNumber: payment.receiptNumber,
          amount: payment.amount,
          paymentDate: payment.createdAt,
          userName: payment.user.name,
          userEmail: payment.user.email,
          sessionTitle: payment.subscription.zoomSession.title,
          sessionStartDate: payment.subscription.zoomSession.startTime,
          paymentId: payment.razorpay_payment_id,
        },
        "Receipt details fetched successfully"
      )
    );
  } catch (error) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Failed to generate receipt"
    );
  }
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
      zoomSession: {
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

  return res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        subscriptions,
        "All zoom subscriptions fetched successfully"
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
      zoomSession: true,
    },
  });

  if (!subscription) {
    throw new ApiError(404, "Subscription not found");
  }

  // Only active, pending approval, or registered subscriptions can be cancelled
  if (
    !["ACTIVE", "PENDING_APPROVAL", "REGISTERED"].includes(subscription.status)
  ) {
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
    if (subscription.user && subscription.zoomSession) {
      await SendEmail({
        email: subscription.user.email,
        subject: "Your Zoom Class Subscription Has Been Cancelled by Admin",
        message: {
          name: subscription.user.name,
          title: subscription.zoomSession.title,
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

// User: Get a single Zoom session by ID
export const getZoomSession = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const zoomSession = await prisma.zoomSession.findUnique({
    where: { id },
    include: {
      subscribedUsers: {
        // Only include user-specific subscription data if user is logged in
        ...(req.user
          ? {
              where: {
                userId: req.user.id,
              },
              include: {
                zoomSession: true,
              },
            }
          : {}),
      },
      createdBy: {
        select: {
          name: true,
        },
      },
      modules: {
        orderBy: {
          position: "asc",
        },
        // Only include sensitive module data if user is logged in
        select: {
          id: true,
          title: true,
          description: true,
          startTime: true,
          endTime: true,
          position: true,
          isFree: true,
          // Only include zoom details if user is authenticated and has proper access
          ...(req.user
            ? {
                zoomLink: true,
                zoomMeetingId: true,
                zoomPassword: true,
              }
            : {}),
        },
      },
    },
  });

  if (!zoomSession) {
    throw new ApiError(404, "Zoom session not found");
  }

  // Check if user has access to class links (paid course fee)
  let isRegistered = false;
  let hasAccessToLinks = false;

  if (req.user && zoomSession.subscribedUsers.length > 0) {
    const subscription = zoomSession.subscribedUsers[0];
    isRegistered = subscription.isRegistered || false;
    hasAccessToLinks = subscription.hasAccessToLinks || false;
  }

  // Create a copy of the session to modify safely
  const sessionData = { ...zoomSession };

  // Remove sensitive fields for unauthorized users
  if (!req.user || !hasAccessToLinks) {
    delete sessionData.zoomLink;
    delete sessionData.zoomMeetingId;
    delete sessionData.zoomPassword;
  }

  // Transform data to include subscription status and teacher name
  const transformedSession = {
    ...sessionData,
    isSubscribed: req.user ? zoomSession.subscribedUsers.length > 0 : false,
    isRegistered,
    hasAccessToLinks,
    teacherName: zoomSession.createdBy?.name || "Instructor",
    formattedDate: new Date(zoomSession.startTime).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    formattedTime: new Date(zoomSession.startTime).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    duration: Math.ceil(
      (new Date(zoomSession.endTime) - new Date(zoomSession.startTime)) /
        (60 * 1000)
    ),
    subscribedUsers: undefined, // Remove the user objects to avoid duplication
    createdBy: undefined, // Remove the user object to avoid duplication
  };

  return res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        transformedSession,
        "Zoom session fetched successfully"
      )
    );
});

// User: Check payment status for a zoom session
export const checkZoomPaymentStatus = asyncHandler(async (req, res) => {
  const { zoomSessionId } = req.params;

  // Verify that the session exists
  const zoomSession = await prisma.zoomSession.findUnique({
    where: { id: zoomSessionId },
  });

  if (!zoomSession) {
    throw new ApiError(404, "Zoom session not found");
  }

  // Check if user has registered for this session
  const subscription = await prisma.zoomSubscription.findFirst({
    where: {
      userId: req.user.id,
      zoomSessionId,
    },
  });

  // Default response
  const response = {
    hasRegistered: false,
    hasPaidCourseFee: false,
  };

  if (subscription) {
    response.hasRegistered = subscription.isRegistered;
    response.hasPaidCourseFee = subscription.hasAccessToLinks;
  }

  return res
    .status(200)
    .json(
      new ApiResponsive(200, response, "Payment status checked successfully")
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
      zoomSession: true,
      module: true,
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
      zoomSession: true,
      module: true,
    },
  });

  // Notify the user about the approval
  try {
    await SendEmail({
      email: subscription.user.email,
      subject: "Your Registration for Zoom Class Has Been Approved",
      message: {
        name: subscription.user.name,
        title: subscription.zoomSession.title,
        date: new Date(subscription.zoomSession.startTime).toLocaleDateString(),
        time: new Date(subscription.zoomSession.startTime).toLocaleTimeString(
          [],
          {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }
        ),
        courseFee: subscription.zoomSession.courseFee,
        // Inform the user they need to pay the course fee to access links
        needsCourseFee:
          !subscription.hasAccessToLinks &&
          subscription.zoomSession.courseFee > 0,
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

// Admin: Reject a zoom subscription
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
      zoomSession: true,
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

  // Update the subscription status to REJECTED
  const updatedSubscription = await prisma.zoomSubscription.update({
    where: { id: subscriptionId },
    data: {
      status: "REJECTED",
      isApproved: false,
      isRegistered: false, // Reset registration status
      hasAccessToLinks: false, // Remove access to links
    },
  });

  // Notify the user about the rejection
  try {
    await SendEmail({
      email: subscription.user.email,
      subject: "Your Registration for Zoom Class Has Been Rejected",
      message: {
        name: subscription.user.name,
        title: subscription.zoomSession.title,
        date: new Date(subscription.zoomSession.startTime).toLocaleDateString(),
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

// User: Register for Zoom Session (pay registration fee)
export const registerForZoomSession = asyncHandler(async (req, res) => {
  const { zoomSessionId } = req.body;

  const zoomSession = await prisma.zoomSession.findUnique({
    where: { id: zoomSessionId },
  });

  if (!zoomSession) {
    throw new ApiError(404, "Zoom session not found");
  }

  if (!zoomSession.isActive) {
    throw new ApiError(400, "This Zoom session is not active");
  }

  // Validate that the registration fee is set
  if (zoomSession.registrationFee <= 0) {
    throw new ApiError(400, "Invalid registration fee");
  }

  // Check if user already has an active registration
  const existingActiveRegistration = await prisma.zoomSubscription.findFirst({
    where: {
      userId: req.user.id,
      zoomSessionId,
      isRegistered: true,
      status: {
        in: ["ACTIVE", "PENDING_APPROVAL"],
      },
    },
  });

  if (existingActiveRegistration) {
    // Return success instead of throwing an error
    return res.status(200).json(
      new ApiResponsive(
        200,
        {
          alreadyRegistered: true,
          subscription: existingActiveRegistration,
        },
        "You are already registered for this session"
      )
    );
  }

  // Check if user had a subscription but cancelled it
  const cancelledSubscription = await prisma.zoomSubscription.findFirst({
    where: {
      userId: req.user.id,
      zoomSessionId,
      status: "CANCELLED",
    },
  });

  // If there's a cancelled subscription, we'll update it when payment completes
  // For now, proceed with creating a new order

  const timestamp = Date.now().toString().slice(-8);
  const shortSessionId = zoomSessionId.slice(0, 8);
  const shortUserId = req.user.id.slice(0, 8);
  const receipt = `zoom_reg_${shortSessionId}_${shortUserId}_${timestamp}`;

  // Create Razorpay order
  const options = {
    amount: Math.round(zoomSession.registrationFee * 100),
    currency: "INR",
    receipt: receipt,
    notes: {
      userId: req.user.id,
      zoomSessionId,
      paymentType: "REGISTRATION",
      previousSubscriptionId: cancelledSubscription
        ? cancelledSubscription.id
        : null,
    },
  };

  const order = await razorpay.orders.create(options);

  return res.status(200).json(
    new ApiResponsive(
      200,
      {
        order,
        zoomSession,
        isRegistration: true,
        isReactivation: cancelledSubscription ? true : false,
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
    zoomSessionId,
  } = req.body;

  if (
    !razorpay_payment_id ||
    !razorpay_order_id ||
    !razorpay_signature ||
    !zoomSessionId
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

  const zoomSession = await prisma.zoomSession.findUnique({
    where: { id: zoomSessionId },
  });

  if (!zoomSession) {
    throw new ApiError(404, "Zoom session not found");
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
            status: "PENDING_APPROVAL", // Reactivated subscriptions need approval
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
            zoomSessionId,
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
              status: "PENDING_APPROVAL",
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
              zoomSessionId,
              startDate,
              endDate,
              nextPaymentDate,
              status: "PENDING_APPROVAL",
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
          amount: zoomSession.registrationFee,
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
        subject: "Registration Confirmed for Zoom Class",
        message: {
          name: req.user.name,
          title: zoomSession.title,
          startDate: zoomSession.startTime,
          amount: zoomSession.registrationFee,
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
          "Registration payment successful. Your registration is pending approval."
        )
      );
  } catch (error) {
    throw new ApiError(500, error.message || "Payment processing failed");
  }
});

// User: Pay for course access (pay course fee)
export const payCourseAccess = asyncHandler(async (req, res) => {
  const { zoomSessionId } = req.body;

  // Check if user is registered first
  const existingSubscription = await prisma.zoomSubscription.findFirst({
    where: {
      userId: req.user.id,
      zoomSessionId,
      isRegistered: true,
    },
  });

  if (!existingSubscription) {
    throw new ApiError(400, "You must register for this session first");
  }

  // Check if user already has access to links
  if (existingSubscription.hasAccessToLinks) {
    return res.status(200).json(
      new ApiResponsive(
        200,
        {
          alreadyHasAccess: true,
          subscription: existingSubscription,
        },
        "You already have access to this session"
      )
    );
  }

  const zoomSession = await prisma.zoomSession.findUnique({
    where: { id: zoomSessionId },
  });

  if (!zoomSession) {
    throw new ApiError(404, "Zoom session not found");
  }

  // Validate that the course fee is set
  if (zoomSession.courseFee <= 0) {
    throw new ApiError(400, "Invalid course fee");
  }

  const timestamp = Date.now().toString().slice(-8);
  const shortSessionId = zoomSessionId.slice(0, 8);
  const shortUserId = req.user.id.slice(0, 8);
  const receipt = `zoom_access_${shortSessionId}_${shortUserId}_${timestamp}`;

  // Create Razorpay order
  const options = {
    amount: Math.round(zoomSession.courseFee * 100),
    currency: "INR",
    receipt: receipt,
    notes: {
      userId: req.user.id,
      zoomSessionId,
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
        zoomSession,
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
    zoomSessionId,
  } = req.body;

  if (
    !razorpay_payment_id ||
    !razorpay_order_id ||
    !razorpay_signature ||
    !zoomSessionId
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
      zoomSessionId,
      isRegistered: true,
    },
  });

  if (!existingSubscription) {
    throw new ApiError(400, "You must register for this session first");
  }

  const zoomSession = await prisma.zoomSession.findUnique({
    where: { id: zoomSessionId },
    include: {
      modules: true,
    },
  });

  if (!zoomSession) {
    throw new ApiError(404, "Zoom session not found");
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
          amount: zoomSession.courseFee,
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
        subject: "Course Access Confirmed for Zoom Class",
        message: {
          name: req.user.name,
          title: zoomSession.title,
          startDate: new Date(zoomSession.startTime).toLocaleDateString(),
          startTime: new Date(zoomSession.startTime).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }),
          meetingLink: zoomSession.zoomLink,
          meetingId: zoomSession.zoomMeetingId,
          password: zoomSession.zoomPassword,
          amount: zoomSession.courseFee,
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

// Admin: Activate session links
export const activateSessionLinks = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  const zoomSession = await prisma.zoomSession.findUnique({
    where: { id: sessionId },
    include: {
      subscribedUsers: {
        where: {
          isRegistered: true,
        },
        include: {
          user: {
            select: {
              email: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!zoomSession) {
    throw new ApiError(404, "Zoom session not found");
  }

  // Create a new Zoom meeting if it doesn't exist
  if (!zoomSession.zoomMeetingId || !zoomSession.zoomLink) {
    const zoomData = await createZoomMeeting({
      title: zoomSession.title,
      startTime: zoomSession.startTime,
      endTime: zoomSession.endTime,
    });

    await prisma.zoomSession.update({
      where: { id: sessionId },
      data: {
        zoomMeetingId: zoomData.zoomMeetingId,
        zoomLink: zoomData.zoomLink,
        zoomPassword: zoomData.zoomPassword,
      },
    });
  }

  // Get the updated session with Zoom details
  const updatedSession = await prisma.zoomSession.findUnique({
    where: { id: sessionId },
  });

  // Send notification emails to all registered users
  const notificationPromises = zoomSession.subscribedUsers.map(
    async (subscription) => {
      try {
        await SendEmail({
          email: subscription.user.email,
          subject: "Zoom Links Now Available for Your Class",
          message: {
            name: subscription.user.name,
            title: zoomSession.title,
            startDate: zoomSession.startTime,
            meetingLink: updatedSession.zoomLink,
            password: updatedSession.zoomPassword,
            meetingId: updatedSession.zoomMeetingId,
          },
          emailType: "ZOOM_LINKS_AVAILABLE",
        });
        return { userId: subscription.userId, status: "sent" };
      } catch (error) {
        return { userId: subscription.userId, status: "failed" };
      }
    }
  );

  // Wait for all notifications to be processed
  const notificationResults = await Promise.all(notificationPromises);

  return res.status(200).json(
    new ApiResponsive(
      200,
      {
        session: updatedSession,
        notificationsCount: notificationResults.length,
        notificationResults,
      },
      "Session links activated and notifications sent"
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
      zoomSession: {
        select: {
          id: true,
          title: true,
          currentRange: true,
          currentOrientation: true,
          registrationFee: true,
          courseFee: true,
          startTime: true,
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

  return res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        pendingSubscriptions,
        "Pending approval subscriptions fetched successfully"
      )
    );
});
