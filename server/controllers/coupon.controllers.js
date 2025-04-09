import { prisma } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";

export const createCoupon = asyncHandler(async (req, res) => {
  const { code, discount, courseIds, validFrom, validUntil, minimumPurchase, limit, isActive, oneTimePerUser } =
    req.body

  if (!code || !discount) {
    throw new ApiError(400, "Code and discount are required")
  }

  if (discount < 1 || discount > 99) {
    throw new ApiError(400, "Discount must be between 1% and 99%")
  }

  try {
    const existingCoupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    })

    if (existingCoupon) {
      throw new ApiError(400, "Coupon code already exists")
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        discount: Number(discount),
        limit: limit !== undefined ? Number(limit) : -1,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        oneTimePerUser: oneTimePerUser !== undefined ? Boolean(oneTimePerUser) : false,
        validFrom: validFrom ? new Date(validFrom) : new Date(),
        validUntil: validUntil ? new Date(validUntil) : null,
        minimumPurchase: minimumPurchase ? Number(minimumPurchase) : null,
        ...(courseIds &&
          courseIds.length > 0 && {
            courses: {
              connect: courseIds.map((id) => ({ id })),
            },
          }),
      },
      include: {
        courses: true,
      },
    })

    return res.status(201).json(new ApiResponsive(201, { coupon }, "Coupon created successfully"))
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError(500, "Error creating coupon", error)
  }
})

export const updateCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { code, discount, courseIds, validFrom, validUntil, minimumPurchase, limit, isActive, oneTimePerUser } =
    req.body

  if (discount && (discount < 1 || discount > 99)) {
    throw new ApiError(400, "Discount must be between 1% and 99%")
  }

  try {
    const existingCoupon = await prisma.coupon.findUnique({
      where: { id },
      include: { courses: true },
    })

    if (!existingCoupon) {
      throw new ApiError(404, "Coupon not found")
    }

    const updatedCoupon = await prisma.coupon.update({
      where: { id },
      data: {
        ...(code && { code: code.toUpperCase() }),
        ...(discount !== undefined && { discount: Number(discount) }),
        ...(limit !== undefined && { limit: Number(limit) }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
        ...(oneTimePerUser !== undefined && { oneTimePerUser: Boolean(oneTimePerUser) }),
        ...(validFrom && { validFrom: new Date(validFrom) }),
        ...(validUntil && { validUntil: new Date(validUntil) }),
        ...(minimumPurchase !== undefined && { minimumPurchase: Number(minimumPurchase) }),
        ...(courseIds && {
          courses: {
            set: courseIds.map((id) => ({ id })),
          },
        }),
      },
      include: {
        courses: true,
      },
    })

    res.status(200).json(new ApiResponsive(200, { coupon: updatedCoupon }, "Coupon updated successfully"))
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError(500, "Error updating coupon", error)
  }
})

// Get all coupons
export const getAllCoupons = asyncHandler(async (req, res) => {
  try {
    const coupons = await prisma.coupon.findMany({
      include: {
        courses: {
          select: {
            id: true,
            title: true,
            price: true
          }
        }
      }
    });

    res
      .status(200)
      .json(new ApiResponsive(200, coupons, "Coupons fetched successfully"));
  } catch (error) {
    throw new ApiError(500, "Error fetching coupons", [error.message]);
  }
});



// Delete coupon
export const deleteCoupon = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.coupon.delete({
      where: { id },
    });

    res
      .status(200)
      .json(new ApiResponsive(200, null, "Coupon deleted successfully"));
  } catch (error) {
    throw new ApiError(500, "Error deleting coupon", [error.message]);
  }
});

export const applyCoupon = asyncHandler(async (req, res) => {
  const { code, courseIds, originalPrice } = req.body;
  const userId = req.user.id;

  try {
    const coupon = await prisma.coupon.findUnique({
      where: { code },
      include: { 
        courses: true,
        usedBy: true 
      }
    });

    if (!coupon || !coupon.isActive) {
      throw new ApiError(400, "Invalid or inactive coupon");
    }

    // Validate expiry
    const now = new Date();
    if (coupon.validUntil && now > new Date(coupon.validUntil)) {
      throw new ApiError(400, "Coupon has expired");
    }

    // Check minimum purchase
    if (coupon.minimumPurchase && originalPrice < coupon.minimumPurchase) {
      throw new ApiError(400, `Minimum purchase amount is ₹${coupon.minimumPurchase}`);
    }

    // Check course-specific restrictions
    if (coupon.courses.length > 0) {
      const validCourseIds = coupon.courses.map(c => c.id);
      const isValidForCourses = courseIds.every(id => validCourseIds.includes(id));
      if (!isValidForCourses) {
        throw new ApiError(400, "Coupon not valid for selected courses");
      }
    }

    // Check one-time usage
    if (coupon.oneTimePerUser) {
      const hasUsed = coupon.usedBy.some(usage => usage.userId === userId);
      if (hasUsed) {
        throw new ApiError(400, "You have already used this coupon");
      }
    }

    // Check usage limit
    if (coupon.limit !== -1 && coupon.usedBy.length >= coupon.limit) {
      throw new ApiError(400, "Coupon usage limit exceeded");
    }

    const discountedPrice = calculateDiscountedPrice(originalPrice, coupon.discount);

    return res.status(200).json(
      new ApiResponsive(200, {
        discountedPrice,
        couponDetails: {
          id: coupon.id,
          code: coupon.code,
          discount: coupon.discount,
          oneTimePerUser: coupon.oneTimePerUser
        }
      }, "Coupon applied successfully")
    );

  } catch (error) {
    throw new ApiError(400, error.message);
  }
});

function calculateDiscountedPrice(originalPrice, discount) {
  const discountAmount = (originalPrice * discount) / 100;
  return originalPrice - discountAmount;
}


export const getCourses = asyncHandler(async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      where: {
        isPublished: true 
      },
      select: {
        id: true,
        title: true,
        price: true
      }
    });

    res
      .status(200)
      .json(new ApiResponsive(200, courses, "Courses fetched successfully"));
  } catch (error) {
    throw new ApiError(500, "Error fetching courses", [error.message]);
  }
});