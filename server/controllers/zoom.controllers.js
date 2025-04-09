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

        const authBuffer = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

        const response = await axios.post(
            'https://zoom.us/oauth/token',
            new URLSearchParams({
                grant_type: 'account_credentials',
                account_id: accountId
            }),
            {
                headers: {
                    'Authorization': `Basic ${authBuffer}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
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
            'https://api.zoom.us/v2/users/me/meetings',
            {
                topic: meetingData.title,
                type: 2, // Scheduled meeting
                start_time: meetingData.startTime,
                duration: Math.ceil((new Date(meetingData.endTime) - new Date(meetingData.startTime)) / (60 * 1000)),
                timezone: 'Asia/Kolkata',
                settings: {
                    host_video: true,
                    participant_video: true,
                    join_before_host: false,
                    mute_upon_entry: true,
                    waiting_room: true
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return {
            zoomMeetingId: String(response.data.id),
            zoomLink: response.data.join_url,
            zoomPassword: response.data.password
        };
    } catch (error) {
        console.error("Error creating Zoom meeting:", error);
        throw new ApiError(500, "Failed to create Zoom meeting");
    }
};

// Admin: Create a new Zoom session
export const createZoomSession = asyncHandler(async (req, res) => {
    const { title, description, startTime, endTime, price, capacity, recurringClass, thumbnailUrl } = req.body;

    if (!title || !startTime || !endTime || price === undefined) {
        // If thumbnail was uploaded but there's an error, delete it from S3
        if (thumbnailUrl) {
            try {
                await deleteFromS3(thumbnailUrl);
            } catch (err) {
                console.error("Error deleting thumbnail after session creation failed:", err);
            }
        }
        throw new ApiError(400, "Please provide all required fields");
    }

    try {
        // Create Zoom meeting
        const zoomData = await createZoomMeeting({
            title,
            startTime,
            endTime
        });

        const zoomSessionData = {
            title,
            description,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            price: parseFloat(price),
            userId: req.user.id,
            zoomLink: zoomData.zoomLink,
            zoomMeetingId: zoomData.zoomMeetingId,
            zoomPassword: zoomData.zoomPassword,
        };

        try {
            if (recurringClass !== undefined) {
                zoomSessionData.recurringClass = recurringClass;
            }

            if (thumbnailUrl) {
                zoomSessionData.thumbnailUrl = thumbnailUrl;
            }

            if (capacity !== undefined && capacity !== null) {
                zoomSessionData.capacity = parseInt(capacity);
            }
        } catch (err) {
            console.log("Some fields might not exist in the schema yet:", err.message);
        }

        const zoomSession = await prisma.zoomSession.create({
            data: zoomSessionData
        });

        return res.status(201).json(
            new ApiResponsive(201, zoomSession, "Zoom session created successfully")
        );
    } catch (error) {
        // If the session creation fails but thumbnail was uploaded, delete the uploaded image
        if (thumbnailUrl) {
            try {
                await deleteFromS3(thumbnailUrl);
            } catch (err) {
                console.error("Error deleting thumbnail after session creation failed:", err);
            }
        }
        throw new ApiError(error.statusCode || 500, error.message || "Failed to create Zoom session");
    }
});

// Admin: Get all Zoom sessions
export const getAllZoomSessions = asyncHandler(async (req, res) => {
    const zoomSessions = await prisma.zoomSession.findMany({
        orderBy: {
            startTime: 'desc'
        },
        include: {
            subscribedUsers: {
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true
                        }
                    }
                }
            }
        }
    });

    return res.status(200).json(
        new ApiResponsive(200, zoomSessions, "Zoom sessions fetched successfully")
    );
});

// Admin: Update Zoom session
export const updateZoomSession = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, description, startTime, endTime, price, isActive, thumbnailUrl } = req.body;

    const zoomSession = await prisma.zoomSession.findUnique({
        where: { id }
    });

    if (!zoomSession) {
        // If thumbnail was uploaded but session doesn't exist, delete it from S3
        if (thumbnailUrl && thumbnailUrl !== zoomSession?.thumbnailUrl) {
            try {
                await deleteFromS3(thumbnailUrl);
            } catch (err) {
                console.error("Error deleting thumbnail after update failed:", err);
            }
        }
        throw new ApiError(404, "Zoom session not found");
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
        if (zoomSession.thumbnailUrl && thumbnailUrl !== zoomSession.thumbnailUrl) {
            try {
                await deleteFromS3(zoomSession.thumbnailUrl);
            } catch (err) {
                console.error("Error deleting old thumbnail:", err);
            }
        }
        updatedFields.thumbnailUrl = thumbnailUrl;
    }

    try {
        const updatedSession = await prisma.zoomSession.update({
            where: { id },
            data: updatedFields
        });

        return res.status(200).json(
            new ApiResponsive(200, updatedSession, "Zoom session updated successfully")
        );
    } catch (error) {
        // If update fails and we uploaded a new thumbnail, delete it
        if (thumbnailUrl && thumbnailUrl !== zoomSession.thumbnailUrl) {
            try {
                await deleteFromS3(thumbnailUrl);
            } catch (err) {
                console.error("Error deleting thumbnail after update failed:", err);
            }
        }
        throw new ApiError(500, "Failed to update Zoom session");
    }
});

// Admin: Delete Zoom session
export const deleteZoomSession = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const zoomSession = await prisma.zoomSession.findUnique({
        where: { id },
        include: {
            subscribedUsers: true
        }
    });

    if (!zoomSession) {
        throw new ApiError(404, "Zoom session not found");
    }

    // Delete the Zoom session and related records in a transaction
    try {
        await prisma.$transaction(async (tx) => {
            // 1. First, find all subscriptions for this session
            const subscriptions = await tx.zoomSubscription.findMany({
                where: { zoomSessionId: id },
                select: { id: true }
            });

            // 2. Get all subscription IDs
            const subscriptionIds = subscriptions.map(sub => sub.id);

            // 3. Delete all related payments first
            if (subscriptionIds.length > 0) {
                await tx.zoomPayment.deleteMany({
                    where: {
                        subscriptionId: {
                            in: subscriptionIds
                        }
                    }
                });
            }
            await tx.zoomSubscription.deleteMany({
                where: { zoomSessionId: id }
            });

            await tx.zoomSession.delete({
                where: { id }
            });
        });

        if (zoomSession.thumbnailUrl) {
            await deleteFromS3(zoomSession.thumbnailUrl);
        }

        return res.status(200).json(
            new ApiResponsive(200, null, "Zoom session deleted successfully")
        );
    } catch (error) {
        console.error("Error deleting zoom session:", error);
        throw new ApiError(500, "Failed to delete Zoom session");
    }
});

// User: Get available Zoom sessions
export const getUserZoomSessions = asyncHandler(async (req, res) => {
    // First, let's check if we have any sessions at all
    const allSessions = await prisma.zoomSession.findMany({
        orderBy: {
            startTime: 'asc'
        }
    });

    // Now get the filtered sessions as per the original logic
    const zoomSessions = await prisma.zoomSession.findMany({
        where: {
            isActive: true,
            startTime: {
                gte: new Date()
            }
        },
        orderBy: {
            startTime: 'asc'
        },
        include: {
            subscribedUsers: {
                where: {
                    userId: req.user.id,
                    status: "ACTIVE"
                }
            },
            createdBy: {
                select: {
                    name: true
                }
            }
        }
    });


    // Check if sessions exist but don't meet the criteria
    if (zoomSessions.length === 0 && allSessions.length > 0) {
        if (req.query.includeAll === 'true') {
            const allUserSessions = await prisma.zoomSession.findMany({
                orderBy: {
                    startTime: 'desc'
                },
                include: {
                    subscribedUsers: {
                        where: {
                            userId: req.user.id,
                            status: "ACTIVE"
                        }
                    },
                    createdBy: {
                        select: {
                            name: true
                        }
                    }
                }
            });

            // Transform data to include subscription status and teacher name
            const transformedSessions = allUserSessions.map(session => ({
                ...session,
                isSubscribed: session.subscribedUsers.length > 0,
                teacherName: session.createdBy?.name || "Instructor",
                formattedDate: new Date(session.startTime).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }),
                formattedTime: new Date(session.startTime).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                duration: Math.ceil((new Date(session.endTime) - new Date(session.startTime)) / (60 * 1000)),
                createdBy: undefined
            }));

            return res.status(200).json(
                new ApiResponsive(200, transformedSessions, "All zoom sessions fetched (including inactive/past)")
            );
        }
    }

    // Transform data to include subscription status and teacher name
    const transformedSessions = zoomSessions.map(session => ({
        ...session,
        isSubscribed: session.subscribedUsers.length > 0,
        teacherName: session.createdBy?.name || "Instructor",
        formattedDate: new Date(session.startTime).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }),
        formattedTime: new Date(session.startTime).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        }),
        duration: Math.ceil((new Date(session.endTime) - new Date(session.startTime)) / (60 * 1000)),
        createdBy: undefined
    }));

    return res.status(200).json(
        new ApiResponsive(200, transformedSessions, "Zoom sessions fetched successfully")
    );
});

// User: Get my subscribed Zoom sessions
export const getMyZoomSubscriptions = asyncHandler(async (req, res) => {
    const subscriptions = await prisma.zoomSubscription.findMany({
        where: {
            userId: req.user.id,
            status: "ACTIVE"
        },
        include: {
            zoomSession: {
                include: {
                    // Fix: Use "createdBy" instead of "user" based on your schema
                    createdBy: {
                        select: {
                            name: true
                        }
                    }
                }
            }
        }
    });

    // Transform data for better frontend display
    const transformedSubscriptions = subscriptions.map(sub => ({
        ...sub,
        zoomSession: {
            ...sub.zoomSession,
            teacherName: sub.zoomSession.createdBy.name,
            formattedDate: new Date(sub.zoomSession.startTime).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }),
            formattedTime: new Date(sub.zoomSession.startTime).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            }),
            duration: Math.ceil((new Date(sub.zoomSession.endTime) - new Date(sub.zoomSession.startTime)) / (60 * 1000)),
            createdBy: undefined // Remove the user object to avoid duplication
        }
    }));

    return res.status(200).json(
        new ApiResponsive(200, transformedSubscriptions, "Your subscriptions fetched successfully")
    );
});

// User: Subscribe to a Zoom session (create Razorpay order)
export const createZoomSubscription = asyncHandler(async (req, res) => {
    const { zoomSessionId } = req.body;

    const zoomSession = await prisma.zoomSession.findUnique({
        where: { id: zoomSessionId }
    });

    if (!zoomSession) {
        throw new ApiError(404, "Zoom session not found");
    }

    if (!zoomSession.isActive) {
        throw new ApiError(400, "This Zoom session is not active");
    }

    // Check if user already has an active subscription
    const existingActiveSubscription = await prisma.zoomSubscription.findFirst({
        where: {
            userId: req.user.id,
            zoomSessionId,
            status: "ACTIVE"
        }
    });

    if (existingActiveSubscription) {
        throw new ApiError(400, "You are already subscribed to this Zoom session");
    }

    // Check if the user had previously subscribed and canceled
    const existingCanceledSubscription = await prisma.zoomSubscription.findFirst({
        where: {
            userId: req.user.id,
            zoomSessionId,
            status: {
                in: ["CANCELLED", "EXPIRED"]
            }
        }
    });

    const timestamp = Date.now().toString().slice(-8);
    const shortSessionId = zoomSessionId.slice(0, 8);
    const shortUserId = req.user.id.slice(0, 8);
    const receipt = `zoom_${shortSessionId}_${shortUserId}_${timestamp}`;

    // Create Razorpay order
    const options = {
        amount: Math.round(zoomSession.price * 100),
        currency: "INR",
        receipt: receipt,
        notes: {
            userId: req.user.id,
            zoomSessionId,
            subscriptionType: existingCanceledSubscription ? "renewal" : "new",
            previousSubscriptionId: existingCanceledSubscription?.id || null
        }
    };

    const order = await razorpay.orders.create(options);

    return res.status(200).json(
        new ApiResponsive(200, {
            order,
            zoomSession,
            isRenewal: !!existingCanceledSubscription,
            previousSubscriptionId: existingCanceledSubscription?.id || null
        }, "Order created successfully")
    );
});

// User: Verify Zoom subscription payment
export const verifyZoomPayment = asyncHandler(async (req, res) => {
    const {
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
        zoomSessionId,
        previousSubscriptionId
    } = req.body;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !zoomSessionId) {
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

    const zoomSession = await prisma.zoomSession.findUnique({
        where: { id: zoomSessionId }
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
    const receiptNumber = `ZM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Create subscription and payment records in transaction
    try {
        const result = await prisma.$transaction(async (tx) => {
            // First, find any existing subscription regardless of status
            const existingSubscription = await tx.zoomSubscription.findFirst({
                where: {
                    userId: req.user.id,
                    zoomSessionId
                }
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
                        status: "ACTIVE"
                    }
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
                        status: "ACTIVE"
                    }
                });
            }

            // Create payment record
            const payment = await tx.zoomPayment.create({
                data: {
                    amount: zoomSession.price,
                    razorpay_order_id,
                    razorpay_payment_id,
                    razorpay_signature,
                    receiptNumber,
                    status: "COMPLETED",
                    userId: req.user.id,
                    subscriptionId: subscription.id
                }
            });

            return { subscription, payment };
        });

        // Send confirmation email
        try {
            await SendEmail({
                email: req.user.email,
                subject: "Zoom Class Subscription Confirmed",
                message: {
                    name: req.user.name,
                    title: zoomSession.title,
                    startDate: zoomSession.startTime,
                    meetingLink: zoomSession.zoomLink,
                    password: zoomSession.zoomPassword,
                    amount: zoomSession.price,
                    receiptNumber: result.payment.receiptNumber,
                    paymentId: result.payment.razorpay_payment_id,
                    date: new Date()
                },
                emailType: "ZOOM_SUBSCRIPTION"
            });
        } catch (error) {
            console.error("Error sending email:", error);
        }

        return res.status(200).json(
            new ApiResponsive(200, result, "Payment successful and subscription activated")
        );

    } catch (error) {
        console.error("Error completing payment process:", error);

        if (error.code === 'P2002' && error.meta?.target?.includes('userId') && error.meta?.target?.includes('zoomSessionId')) {
            try {
                const existingSubscription = await prisma.zoomSubscription.findFirst({
                    where: {
                        userId: req.user.id,
                        zoomSessionId
                    }
                });

                if (existingSubscription) {
                    const updatedSubscription = await prisma.zoomSubscription.update({
                        where: { id: existingSubscription.id },
                        data: {
                            startDate,
                            endDate,
                            nextPaymentDate,
                            status: "ACTIVE"
                        }
                    });

                    const payment = await prisma.zoomPayment.create({
                        data: {
                            amount: zoomSession.price,
                            razorpay_order_id,
                            razorpay_payment_id,
                            razorpay_signature,
                            receiptNumber,
                            status: "COMPLETED",
                            userId: req.user.id,
                            subscriptionId: updatedSubscription.id
                        }
                    });

                    return res.status(200).json(
                        new ApiResponsive(200, { subscription: updatedSubscription, payment }, "Payment successful and subscription reactivated")
                    );
                }
            } catch (secondError) {
                console.error("Error in fallback approach:", secondError);
            }
        }

        throw new ApiError(500, "Failed to process payment. Please contact support.");
    }
});

// User: Cancel subscription
export const cancelZoomSubscription = asyncHandler(async (req, res) => {
    const { subscriptionId } = req.params;

    const subscription = await prisma.zoomSubscription.findUnique({
        where: {
            id: subscriptionId,
            userId: req.user.id
        }
    });

    if (!subscription) {
        throw new ApiError(404, "Subscription not found");
    }

    const updatedSubscription = await prisma.zoomSubscription.update({
        where: { id: subscriptionId },
        data: { status: "CANCELLED" }
    });

    return res.status(200).json(
        new ApiResponsive(200, updatedSubscription, "Subscription cancelled successfully")
    );
});

// Check if user has active subscription for a Zoom session
export const checkZoomSubscription = asyncHandler(async (req, res) => {
    const { zoomSessionId } = req.params;

    const subscription = await prisma.zoomSubscription.findFirst({
        where: {
            userId: req.user.id,
            zoomSessionId,
            status: "ACTIVE",
            endDate: {
                gte: new Date()
            }
        },
        include: {
            zoomSession: true
        }
    });

    if (!subscription) {
        return res.status(200).json(
            new ApiResponsive(200, { isSubscribed: false }, "Not subscribed to this session")
        );
    }

    return res.status(200).json(
        new ApiResponsive(200, {
            isSubscribed: true,
            subscription,
            meetingDetails: {
                link: subscription.zoomSession.zoomLink,
                password: subscription.zoomSession.zoomPassword,
                meetingId: subscription.zoomSession.zoomMeetingId
            }
        }, "Active subscription found")
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
                    status: "ACTIVE"
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    },
                    payments: {
                        orderBy: {
                            createdAt: "desc"
                        },
                        take: 1
                    }
                }
            }
        }
    });

    if (!zoomSession) {
        throw new ApiError(404, "Zoom session not found");
    }

    const attendees = zoomSession.subscribedUsers.map(sub => ({
        userId: sub.user.id,
        name: sub.user.name,
        email: sub.user.email,
        subscriptionId: sub.id,
        subscriptionStatus: sub.status,
        lastPayment: sub.payments[0] || null,
        nextPaymentDue: sub.nextPaymentDate
    }));

    return res.status(200).json(
        new ApiResponsive(200, {
            zoomSession,
            attendees,
            totalAttendees: attendees.length
        }, "Attendees fetched successfully")
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
                    status: "ACTIVE"
                },
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true
                        }
                    }
                }
            }
        }
    });

    if (!zoomSession) {
        throw new ApiError(404, "Zoom session not found");
    }

    const emailPromises = zoomSession.subscribedUsers.map(sub => {
        return SendEmail({
            email: sub.user.email,
            subject: `Reminder: ${zoomSession.title} starts soon`,
            message: {
                name: sub.user.name,
                title: zoomSession.title,
                startTime: zoomSession.startTime,
                meetingLink: zoomSession.zoomLink,
                password: zoomSession.zoomPassword
            },
            emailType: "ZOOM_REMINDER"
        });
    });

    await Promise.all(emailPromises);

    return res.status(200).json(
        new ApiResponsive(200, {
            remindersSent: zoomSession.subscribedUsers.length
        }, "Meeting reminders sent successfully")
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
                lte: today
            }
        },
        include: {
            user: true,
            zoomSession: true
        }
    });

    const results = {
        processed: 0,
        failed: 0,
        details: []
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
                    endDate: today
                }
            });

            results.processed++;
            results.details.push({
                subscriptionId: subscription.id,
                status: "expired",
                user: subscription.user.email,
                session: subscription.zoomSession.title
            });

            // Send notification about expiry
            await SendEmail({
                email: subscription.user.email,
                subject: "Your Zoom Class Subscription Has Expired",
                message: {
                    name: subscription.user.name,
                    title: subscription.zoomSession.title
                },
                emailType: "ZOOM_EXPIRY"
            });
        } catch (error) {
            results.failed++;
            results.details.push({
                subscriptionId: subscription.id,
                status: "failed",
                error: error.message
            });
        }
    }

    return res.status(200).json(
        new ApiResponsive(200, results, "Subscription renewals processed")
    );
});

// Admin: Get all payments
export const getAllZoomPayments = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const payments = await prisma.zoomPayment.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            },
            subscription: {
                include: {
                    zoomSession: {
                        select: {
                            id: true,
                            title: true
                        }
                    }
                }
            }
        }
    });

    const total = await prisma.zoomPayment.count();

    return res.status(200).json(
        new ApiResponsive(200, {
            payments,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        }, "Zoom payments fetched successfully")
    );
});

// Admin: Get zoom analytics
export const getZoomAnalytics = asyncHandler(async (req, res) => {
    // Get summary data for dashboard
    const totalSessions = await prisma.zoomSession.count();
    const activeSubscriptions = await prisma.zoomSubscription.count({
        where: { status: "ACTIVE" }
    });

    // Get revenue data
    const payments = await prisma.zoomPayment.findMany({
        where: { status: "COMPLETED" },
        include: {
            subscription: {
                include: {
                    zoomSession: true
                }
            }
        }
    });

    const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);

    // Monthly revenue analysis
    const monthlyRevenue = {};
    payments.forEach(payment => {
        const month = new Date(payment.createdAt).toLocaleString('default', { month: 'long', year: 'numeric' });
        monthlyRevenue[month] = (monthlyRevenue[month] || 0) + payment.amount;
    });

    // Recent payments
    const recentPayments = await prisma.zoomPayment.findMany({
        where: { status: "COMPLETED" },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
            user: {
                select: {
                    name: true,
                    email: true
                }
            },
            subscription: {
                include: {
                    zoomSession: {
                        select: {
                            title: true
                        }
                    }
                }
            }
        }
    });

    // Session popularity
    const sessionSubscriptions = await prisma.zoomSession.findMany({
        include: {
            subscribedUsers: {
                where: { status: "ACTIVE" }
            }
        }
    });

    const sessionPopularity = sessionSubscriptions.map(session => ({
        id: session.id,
        title: session.title,
        subscriberCount: session.subscribedUsers.length,
        isActive: session.isActive
    })).sort((a, b) => b.subscriberCount - a.subscriberCount);

    return res.status(200).json(
        new ApiResponsive(200, {
            totalSessions,
            activeSubscriptions,
            totalRevenue,
            monthlyRevenue,
            recentPayments,
            sessionPopularity
        }, "Zoom analytics fetched successfully")
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
                        zoomSession: true
                    }
                }
            }
        });

        if (!payment) {
            throw new ApiError(404, "Payment not found");
        }

        // Check if user has permission
        if (payment.userId !== req.user.id && req.user.role !== 'ADMIN') {
            throw new ApiError(403, "You don't have permission to access this receipt");
        }

        // Here you would typically generate a PDF
        // For now, we'll just return payment details
        return res.status(200).json(
            new ApiResponsive(200, {
                receiptNumber: payment.receiptNumber,
                amount: payment.amount,
                paymentDate: payment.createdAt,
                userName: payment.user.name,
                userEmail: payment.user.email,
                sessionTitle: payment.subscription.zoomSession.title,
                sessionStartDate: payment.subscription.zoomSession.startTime,
                paymentId: payment.razorpay_payment_id
            }, "Receipt details fetched successfully")
        );
    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || "Failed to generate receipt");
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
                    email: true
                }
            },
            zoomSession: {
                select: {
                    id: true,
                    title: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    return res.status(200).json(
        new ApiResponsive(200, subscriptions, "All zoom subscriptions fetched successfully")
    );
});

// Admin: Cancel subscription (by admin)
export const adminCancelZoomSubscription = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const subscription = await prisma.zoomSubscription.findUnique({
        where: { id }
    });

    if (!subscription) {
        throw new ApiError(404, "Subscription not found");
    }

    const updatedSubscription = await prisma.zoomSubscription.update({
        where: { id },
        data: { status: "CANCELLED" }
    });

    // Notify user about cancellation
    try {
        const user = await prisma.user.findUnique({
            where: { id: subscription.userId }
        });

        const zoomSession = await prisma.zoomSession.findUnique({
            where: { id: subscription.zoomSessionId }
        });

        if (user && zoomSession) {
            await SendEmail({
                email: user.email,
                subject: "Your Zoom Class Subscription Has Been Cancelled",
                message: {
                    name: user.name,
                    title: zoomSession.title
                },
                emailType: "ZOOM_CANCELLATION"
            });
        }
    } catch (error) {
        console.error("Error sending cancellation email:", error);
    }

    return res.status(200).json(
        new ApiResponsive(200, updatedSubscription, "Subscription cancelled successfully")
    );
});