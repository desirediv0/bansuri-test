import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import axios from "axios";
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

    // Convert string time to Date if needed
    const startTime =
      typeof meetingData.startTime === "string"
        ? new Date(meetingData.startTime)
        : meetingData.startTime;

    const endTime = meetingData.endTime
      ? typeof meetingData.endTime === "string"
        ? new Date(meetingData.endTime)
        : meetingData.endTime
      : new Date(startTime.getTime() + 60 * 60 * 1000); // Default 1 hour

    // Calculate duration in minutes
    const durationInMinutes = Math.ceil((endTime - startTime) / (60 * 1000));

    const response = await axios.post(
      "https://api.zoom.us/v2/users/me/meetings",
      {
        topic: meetingData.title,
        type: 2, // Scheduled meeting
        start_time: startTime.toISOString(),
        duration: durationInMinutes,
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

// Admin: Create a new Zoom live class
export const createZoomLiveClass = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    startTime,
    endTime,
    price,
    getPrice,
    registrationFee,
    courseFee,
    courseFeeEnabled,
    capacity,
    recurringClass,
    thumbnailUrl,
    hasModules,
    isFirstModuleFree,
    modules,
    currentRaga,
    currentOrientation,
    sessionDescription,
    isActive,
    slug,
  } = req.body;

  if (!title || !startTime || !thumbnailUrl || !slug) {
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
    const zoomLiveClassData = {
      title,
      description,
      startTime,
      endTime,
      price: parseFloat(price || 0),
      getPrice: getPrice || false,
      userId: req.user.id,
      zoomLink: zoomData.zoomLink,
      zoomMeetingId: zoomData.zoomMeetingId,
      zoomPassword: zoomData.zoomPassword,
      thumbnailUrl,
      slug,
    };

    // Add optional fields if provided
    if (registrationFee !== undefined) {
      zoomLiveClassData.registrationFee = parseFloat(registrationFee || 0);
    }

    if (courseFee !== undefined) {
      zoomLiveClassData.courseFee = parseFloat(courseFee || 0);
    }

    if (courseFeeEnabled !== undefined) {
      zoomLiveClassData.courseFeeEnabled = courseFeeEnabled;
    }

    if (hasModules !== undefined) {
      zoomLiveClassData.hasModules = hasModules || false;
    }

    if (isFirstModuleFree !== undefined) {
      zoomLiveClassData.isFirstModuleFree = isFirstModuleFree || false;
    }

    if (currentRaga !== undefined) {
      zoomLiveClassData.currentRaga = currentRaga || null;
    }

    if (currentOrientation !== undefined) {
      zoomLiveClassData.currentOrientation = currentOrientation || null;
    }

    if (sessionDescription !== undefined) {
      zoomLiveClassData.sessionDescription = sessionDescription || null;
    }

    if (isActive !== undefined) {
      zoomLiveClassData.isActive = isActive;
    }

    if (recurringClass !== undefined) {
      zoomLiveClassData.recurringClass = recurringClass;
    }

    if (capacity !== undefined && capacity !== null) {
      zoomLiveClassData.capacity = parseInt(capacity);
    }

    // Use a transaction to create the Zoom session and modules
    const zoomLiveClass = await prisma.$transaction(async (tx) => {
      // Create the main zoom live class
      const liveClass = await tx.zoomLiveClass.create({
        data: zoomLiveClassData,
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
              zoomLiveClassId: liveClass.id,
            },
          });
        }
      }

      return liveClass;
    });

    return res
      .status(201)
      .json(
        new ApiResponsive(
          201,
          zoomLiveClass,
          "Zoom live class created successfully"
        )
      );
  } catch (error) {
    // If the session creation fails but thumbnail was uploaded, delete the uploaded image
    if (thumbnailUrl) {
      try {
        await deleteFromS3(thumbnailUrl);
      } catch (err) {
        console.error(
          "Error deleting thumbnail after live class creation failed:",
          err
        );
      }
    }
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Failed to create Zoom live class"
    );
  }
});

// Admin: Get all Zoom live classes
export const getAllZoomLiveClasses = asyncHandler(async (req, res) => {
  // For admin users, return all zoom live class data including sensitive fields
  const zoomLiveClasses = await prisma.zoomLiveClass.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      subscriptions: {
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
      createdBy: {
        select: {
          name: true,
          email: true,
        },
      },
      modules: true,
    },
  });

  return res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        zoomLiveClasses,
        "Zoom live classes fetched successfully"
      )
    );
});

// Admin: Update Zoom live class
export const updateZoomLiveClass = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    startTime,
    price,
    getPrice,
    registrationFee,
    courseFee,
    courseFeeEnabled,
    capacity,
    recurringClass,
    thumbnailUrl,
    hasModules,
    isFirstModuleFree,
    currentRaga,
    currentOrientation,
    sessionDescription,
    isActive,
    slug,
  } = req.body;

  const zoomLiveClass = await prisma.zoomLiveClass.findUnique({
    where: { id },
  });

  if (!zoomLiveClass) {
    // If a new thumbnail was uploaded but class doesn't exist, delete it from S3
    if (thumbnailUrl) {
      try {
        await deleteFromS3(thumbnailUrl);
      } catch (err) {
        console.error("Error deleting thumbnail after update failed:", err);
      }
    }
    throw new ApiError(404, "Zoom live class not found");
  }

  const updatedFields = {};
  if (title !== undefined) updatedFields.title = title;
  if (description !== undefined) updatedFields.description = description;
  if (startTime !== undefined) updatedFields.startTime = startTime;
  if (price !== undefined) updatedFields.price = parseFloat(price);
  if (getPrice !== undefined) updatedFields.getPrice = getPrice;
  if (registrationFee !== undefined)
    updatedFields.registrationFee = parseFloat(registrationFee);
  if (courseFee !== undefined) updatedFields.courseFee = parseFloat(courseFee);
  if (courseFeeEnabled !== undefined)
    updatedFields.courseFeeEnabled = courseFeeEnabled;
  if (capacity !== undefined && capacity !== null)
    updatedFields.capacity = parseInt(capacity);
  if (recurringClass !== undefined)
    updatedFields.recurringClass = recurringClass;
  if (hasModules !== undefined) updatedFields.hasModules = hasModules;
  if (isFirstModuleFree !== undefined)
    updatedFields.isFirstModuleFree = isFirstModuleFree;
  if (currentRaga !== undefined) updatedFields.currentRaga = currentRaga;
  if (currentOrientation !== undefined)
    updatedFields.currentOrientation = currentOrientation;
  if (sessionDescription !== undefined)
    updatedFields.sessionDescription = sessionDescription;
  if (isActive !== undefined) updatedFields.isActive = isActive;
  if (slug !== undefined) updatedFields.slug = slug;

  // Handle thumbnail update
  if (thumbnailUrl !== undefined) {
    // If the thumbnail URL has changed and old one exists, delete the old one from S3
    const oldThumbnailUrl = zoomLiveClass.thumbnailUrl;
    const thumbnailHasChanged =
      oldThumbnailUrl && oldThumbnailUrl !== thumbnailUrl;

    if (thumbnailHasChanged) {
      try {
        console.log(`Deleting old thumbnail: ${oldThumbnailUrl}`);
        await deleteFromS3(oldThumbnailUrl);
      } catch (err) {
        console.error("Error deleting old thumbnail:", err);
        // Continue with the update even if thumbnail deletion fails
      }
    }
    updatedFields.thumbnailUrl = thumbnailUrl;
  }

  try {
    const updatedClass = await prisma.zoomLiveClass.update({
      where: { id },
      data: updatedFields,
    });

    return res
      .status(200)
      .json(
        new ApiResponsive(
          200,
          updatedClass,
          "Zoom live class updated successfully"
        )
      );
  } catch (error) {
    console.error("Error updating zoom live class:", error);
    // If update fails and we uploaded a new thumbnail, delete it
    const oldThumbnailUrl = zoomLiveClass.thumbnailUrl;
    if (thumbnailUrl && thumbnailUrl !== oldThumbnailUrl) {
      try {
        await deleteFromS3(thumbnailUrl);
      } catch (err) {
        console.error("Error deleting thumbnail after update failed:", err);
      }
    }
    throw new ApiError(500, "Failed to update Zoom live class");
  }
});

// Admin: Delete Zoom live class
export const deleteZoomLiveClass = asyncHandler(async (req, res) => {
  const { id } = req.params;

  console.log(`Attempting to delete zoom live class with ID: ${id}`);

  const zoomLiveClass = await prisma.zoomLiveClass.findUnique({
    where: { id },
    include: {
      subscriptions: true,
      modules: true,
    },
  });

  if (!zoomLiveClass) {
    console.log(`Zoom live class with ID ${id} not found`);
    throw new ApiError(404, "Zoom live class not found");
  }

  console.log(
    `Found zoom live class: ${zoomLiveClass.title} with ${zoomLiveClass.subscriptions.length} subscriptions and ${zoomLiveClass.modules.length} modules`
  );

  // Delete the Zoom live class and related records in a transaction
  try {
    console.log(
      `Starting transaction to delete zoom live class and related data`
    );
    await prisma.$transaction(async (tx) => {
      // 1. First, find all subscriptions for this class
      const subscriptions = await tx.zoomSubscription.findMany({
        where: { zoomLiveClassId: id },
        select: { id: true },
      });

      // 2. Get all subscription IDs
      const subscriptionIds = subscriptions.map((sub) => sub.id);
      console.log(`Found ${subscriptionIds.length} subscriptions to delete`);

      // 3. Delete all related payments first
      if (subscriptionIds.length > 0) {
        const deletedPayments = await tx.zoomPayment.deleteMany({
          where: {
            subscriptionId: {
              in: subscriptionIds,
            },
          },
        });
        console.log(`Deleted ${deletedPayments.count} related payments`);
      }

      // 4. Delete all modules
      const deletedModules = await tx.zoomSessionModule.deleteMany({
        where: { zoomLiveClassId: id },
      });
      console.log(`Deleted ${deletedModules.count} modules`);

      // 5. Delete all subscriptions
      const deletedSubscriptions = await tx.zoomSubscription.deleteMany({
        where: { zoomLiveClassId: id },
      });
      console.log(`Deleted ${deletedSubscriptions.count} subscriptions`);

      // 6. Finally, delete the class itself
      await tx.zoomLiveClass.delete({
        where: { id },
      });
      console.log(`Deleted zoom live class with ID: ${id}`);
    });

    // Delete the thumbnail if it exists (after the database transaction completes)
    if (zoomLiveClass.thumbnailUrl) {
      try {
        console.log(
          `Attempting to delete thumbnail from S3: ${zoomLiveClass.thumbnailUrl}`
        );
        await deleteFromS3(zoomLiveClass.thumbnailUrl);
        console.log(`Successfully deleted thumbnail from S3`);
      } catch (s3Error) {
        console.error(`Failed to delete thumbnail from S3: ${s3Error.message}`);
        // Continue with the response even if S3 deletion fails
      }
    }

    return res
      .status(200)
      .json(
        new ApiResponsive(200, null, "Zoom live class deleted successfully")
      );
  } catch (error) {
    console.error("Error deleting zoom live class:", error);
    throw new ApiError(
      500,
      "Failed to delete Zoom live class: " + error.message
    );
  }
});

// User: Get available Zoom live classes
export const getUserZoomLiveClasses = asyncHandler(async (req, res) => {
  const zoomLiveClasses = await prisma.zoomLiveClass.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      subscriptions: {
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
      modules: true,
    },
  });

  // Process each class to add formatted data and remove sensitive information
  const processedClasses = zoomLiveClasses.map((liveClass) => {
    // Check if user has access to links
    let isRegistered = false;
    let hasAccessToLinks = false;

    if (req.user && liveClass.subscriptions?.length > 0) {
      const subscription = liveClass.subscriptions[0];
      isRegistered = subscription.isRegistered || false;
      hasAccessToLinks = subscription.hasAccessToLinks || false;
    }

    // Create a copy of the class data
    const classData = { ...liveClass };

    // Remove sensitive zoom details unless user has access
    if (!req.user || !hasAccessToLinks) {
      delete classData.zoomLink;
      delete classData.zoomMeetingId;
      delete classData.zoomPassword;

      // Also remove sensitive info from modules
      if (classData.modules) {
        classData.modules = classData.modules.map((module) => {
          const moduleCopy = { ...module };
          delete moduleCopy.zoomLink;
          delete moduleCopy.zoomMeetingId;
          delete moduleCopy.zoomPassword;
          return moduleCopy;
        });
      }
    }

    // Return transformed class
    return {
      ...classData,
      isRegistered,
      hasAccessToLinks,
      teacherName: liveClass.createdBy?.name || "Instructor",
      formattedDate:
        typeof liveClass.startTime === "string"
          ? new Date(liveClass.startTime).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : "Date pending",
      formattedTime:
        typeof liveClass.startTime === "string"
          ? new Date(liveClass.startTime).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "Time pending",
      subscriptions: undefined,
      createdBy: undefined,
    };
  });

  return res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        processedClasses,
        "Zoom live classes fetched successfully"
      )
    );
});

// Get a single Zoom live class by ID or slug
export const getZoomLiveClass = asyncHandler(async (req, res) => {
  const { idOrSlug } = req.params;

  // Try to find by ID first, then by slug
  const zoomLiveClass = await prisma.zoomLiveClass.findFirst({
    where: {
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    },
    include: {
      subscriptions: {
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
      modules: {
        orderBy: {
          position: "asc",
        },
      },
    },
  });

  if (!zoomLiveClass) {
    throw new ApiError(404, "Zoom live class not found");
  }

  // Check if user has access to links
  let isRegistered = false;
  let hasAccessToLinks = false;

  if (req.user && zoomLiveClass.subscriptions?.length > 0) {
    const subscription = zoomLiveClass.subscriptions[0];
    isRegistered = subscription.isRegistered || false;
    hasAccessToLinks = subscription.hasAccessToLinks || false;
  }

  // Create a copy of the class data
  const classData = { ...zoomLiveClass };

  // Remove sensitive zoom details unless user has access
  if (!req.user || !hasAccessToLinks) {
    delete classData.zoomLink;
    delete classData.zoomMeetingId;
    delete classData.zoomPassword;

    // Also remove sensitive info from modules
    if (classData.modules) {
      classData.modules = classData.modules.map((module) => {
        const moduleCopy = { ...module };
        delete moduleCopy.zoomLink;
        delete moduleCopy.zoomMeetingId;
        delete moduleCopy.zoomPassword;
        return moduleCopy;
      });
    }
  }

  // Return transformed class with additional formatted data
  const transformedClass = {
    ...classData,
    isRegistered,
    hasAccessToLinks,
    teacherName: zoomLiveClass.createdBy?.name || "Instructor",
    formattedDate:
      typeof zoomLiveClass.startTime === "string"
        ? new Date(zoomLiveClass.startTime).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "Date pending",
    formattedTime:
      typeof zoomLiveClass.startTime === "string"
        ? new Date(zoomLiveClass.startTime).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "Time pending",
    subscriptions: undefined,
    createdBy: undefined,
  };

  return res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        transformedClass,
        "Zoom live class fetched successfully"
      )
    );
});

// Admin: Toggle course fee enabled status
export const toggleCourseFeeEnabled = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { courseFeeEnabled } = req.body;

  const zoomLiveClass = await prisma.zoomLiveClass.findUnique({
    where: { id },
  });

  if (!zoomLiveClass) {
    throw new ApiError(404, "Zoom live class not found");
  }

  const updatedClass = await prisma.zoomLiveClass.update({
    where: { id },
    data: {
      courseFeeEnabled: courseFeeEnabled,
    },
  });

  return res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        updatedClass,
        `Course fee requirement ${
          courseFeeEnabled ? "enabled" : "disabled"
        } successfully`
      )
    );
});

// Admin: Get registrations for a class
export const getClassRegistrations = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const registrations = await prisma.zoomSubscription.findMany({
    where: {
      zoomLiveClassId: id,
      isRegistered: true,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
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
        registrations,
        "Class registrations fetched successfully"
      )
    );
});

// Admin: Bulk approve registrations
export const bulkApproveRegistrations = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userIds } = req.body;

  const zoomLiveClass = await prisma.zoomLiveClass.findUnique({
    where: { id },
  });

  if (!zoomLiveClass) {
    throw new ApiError(404, "Zoom live class not found");
  }

  // Update all specified subscriptions
  const updatedSubscriptions = await prisma.$transaction(
    userIds.map((userId) =>
      prisma.zoomSubscription.update({
        where: {
          userId_zoomLiveClassId: {
            userId,
            zoomLiveClassId: id,
          },
        },
        data: {
          isApproved: true,
          status: "ACTIVE",
          hasAccessToLinks: !zoomLiveClass.courseFeeEnabled, // Give access if course fee is not required
        },
      })
    )
  );

  return res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        updatedSubscriptions,
        "Registrations approved successfully"
      )
    );
});

// Admin: Remove access for users
export const removeUserAccess = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userIds } = req.body;

  const zoomLiveClass = await prisma.zoomLiveClass.findUnique({
    where: { id },
  });

  if (!zoomLiveClass) {
    throw new ApiError(404, "Zoom live class not found");
  }

  // Update all specified subscriptions
  const updatedSubscriptions = await prisma.$transaction(
    userIds.map((userId) =>
      prisma.zoomSubscription.update({
        where: {
          userId_zoomLiveClassId: {
            userId,
            zoomLiveClassId: id,
          },
        },
        data: {
          hasAccessToLinks: false,
          status: "CANCELLED",
        },
      })
    )
  );

  return res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        updatedSubscriptions,
        "Access removed successfully"
      )
    );
});

// Add getClassAttendees controller
export const getClassAttendees = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const zoomLiveClass = await prisma.zoomLiveClass.findUnique({
    where: { id },
    include: {
      subscriptions: {
        where: {
          hasAccessToLinks: true, // Only get users who have access
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!zoomLiveClass) {
    throw new ApiError(404, "Zoom live class not found");
  }

  // Transform the data for better frontend consumption
  const attendees = zoomLiveClass.subscriptions.map((sub) => ({
    id: sub.id,
    userId: sub.user.id,
    name: sub.user.name,
    email: sub.user.email,
    joinedAt: sub.createdAt,
    status: sub.status,
  }));

  return res
    .status(200)
    .json(
      new ApiResponsive(200, attendees, "Class attendees fetched successfully")
    );
});
