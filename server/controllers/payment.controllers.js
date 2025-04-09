import crypto from "crypto";
import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { razorpay } from "../app.js";

export const getRazorpayKey = asyncHandler(async (req, res) => {
  res.status(200).json({
    key: process.env.RAZORPAY_KEY_ID,
  });
});

export const checkout = asyncHandler(async (req, res) => {
  try {
    const options = {
      amount: Number(req.body.amount),
      currency: "INR",
    };
    const order = await razorpay.orders.create(options);

    if (!order) {
      throw new ApiError(500, "Error creating order");
    }

    res
      .status(200)
      .json(new ApiResponsive(200, order, "Order created successfully"));
  } catch (error) {
    throw new ApiError(500, "Error creating order", [error.message]);
  }
});

export const paymentVerification = asyncHandler(async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      courseIds,
      billingId,
      couponDetails,
      courseDetails,
    } = req.body;

    // Validation
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new ApiError(400, "Missing payment details");
    }

    if (!Array.isArray(courseIds) || !courseIds.length) {
      throw new ApiError(400, "Invalid course details");
    }

    if (!billingId) {
      throw new ApiError(400, "Missing billing ID");
    }

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      throw new ApiError(400, "Invalid payment signature");
    }

    // Check billing exists
    const billing = await prisma.billingDetails.findUnique({
      where: { id: billingId },
    });

    if (!billing) {
      throw new ApiError(404, "Billing not found");
    }

    // Process transaction
    await prisma.$transaction(async (tx) => {
      // 1. Create payment
      const payment = await tx.payment.create({
        data: {
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
          status: "SUCCESS",
          user: {
            connect: {
              id: req.user.id
            }
          }
        },
      });

      // 2. Update billing
      await tx.billingDetails.update({
        where: { id: billingId },
        data: {
          paymentStatus: true
        },
      });

      // 3. Process courses
      for (const courseId of courseIds) {
        const courseDetail = courseDetails.find((c) => c.id === courseId);
        if (!courseDetail) continue;

        // Create purchase
        await tx.purchase.create({
          data: {
            user: {
              connect: { id: req.user.id }
            },
            course: {
              connect: { id: courseId }
            },
            purchasePrice: courseDetail.discountedPrice || courseDetail.price,
            discountPrice: courseDetail.discountedPrice
              ? courseDetail.price - courseDetail.discountedPrice
              : 0,
            couponCode: couponDetails?.code || null
          },
        });

        // Create/update enrollment
        await tx.enrollment.upsert({
          where: {
            userId_courseId: {
              userId: req.user.id,
              courseId,
            },
          },
          create: {
            user: {
              connect: { id: req.user.id }
            },
            course: {
              connect: { id: courseId }
            }
          },
          update: {},
        });
      }

      // 4. Handle coupon usage
      if (couponDetails?.id) {
        await tx.couponUsage.create({
          data: {
            coupon: {
              connect: { id: couponDetails.id }
            },
            user: {
              connect: { id: req.user.id }
            },
            course: courseIds.length === 1 ? {
              connect: { id: courseIds[0] }
            } : undefined
          },
        });
      }

      // 5. Clear cart
      await tx.cart.deleteMany({
        where: {
          userId: req.user.id,
          courseId: { in: courseIds },
        },
      });
    });

    return res.status(200).json(
      new ApiResponsive(200, { success: true }, "Payment successful")
    );

  } catch (error) {
    console.error("Payment Verification Error:", error);

    if (error.code === 'P2002') {
      throw new ApiError(400, "Duplicate payment record");
    }

    if (error.code === 'P2025') {
      throw new ApiError(404, "Related record not found");
    }

    throw new ApiError(
      error.statusCode || 500,
      error.message || "Payment verification failed"
    );
  }
});