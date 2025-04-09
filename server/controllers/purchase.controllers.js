import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createPurchase = asyncHandler(async (req, res) => {
  const { courseId, purchasePrice, discountPrice, couponCode } = req.body;
  const userId = req.user.id;

  // Check if course exists
  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  // Check if purchase already exists
  const existingPurchase = await prisma.purchase.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId,
      },
    },
  });

  if (existingPurchase) {
    return res
      .status(200)
      .json(
        new ApiResponsive(200, "Course already purchased", existingPurchase)
      );
  }

  // Create new purchase
  const purchase = await prisma.purchase.create({
    data: {
      userId,
      courseId,
      purchasePrice,
      discountPrice,
      couponCode,
    },
  });

  return res
    .status(201)
    .json(new ApiResponsive(201, "Course purchased successfully", purchase));
});

// Check if a user has purchased a course
export const checkPurchase = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user.id;

  const purchase = await prisma.purchase.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId,
      },
    },
  });

  if (!purchase) {
    return res
      .status(200)
      .json(
        new ApiResponsive(200, "Course not purchased", { purchased: false })
      );
  }

  return res
    .status(200)
    .json(new ApiResponsive(200, "Course purchased", { purchased: true }));
});

export const getMyPurchases = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const purchases = await prisma.purchase.findMany({
    where: {
      userId,
    },
    orderBy: { createdAt: "desc" },
    include: {
      course: {
        include: {
          category: true,

        }
      },
    },
  });

  return res
    .status(200)
    .json(
      new ApiResponsive(200, "User purchases retrieved successfully", purchases)
    );
});

export const AdminGetAllPurchases = asyncHandler(async (req, res) => {
  const purchases = await prisma.purchase.findMany({
    include: {
      course: {
        select: {
          id: true,
          title: true,
          price: true,
          salePrice: true,
        },
      },
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

  const purchasesWithDetails = purchases.map((purchase) => ({
    ...purchase,
    savingsAmount: purchase.discountPrice
      ? purchase.course.price - purchase.purchasePrice
      : 0,
    originalPrice: purchase.course.price,
    finalPrice: purchase.purchasePrice,
    purchaseDate: purchase.createdAt,
  }));

  return res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        { purchases: purchasesWithDetails },
        "All purchases retrieved successfully"
      )
    );
});

// Add a new API endpoint to get purchase history for a specific course
export const getCoursePurchaseHistory = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  const purchases = await prisma.purchase.findMany({
    where: {
      courseId: courseId,
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const purchaseHistory = purchases.map((purchase) => ({
    id: purchase.id,
    userName: purchase.user.name,
    userEmail: purchase.user.email,
    purchasePrice: purchase.purchasePrice,
    originalPrice: purchase.course.price,
    discount: purchase.discountPrice || 0,
    couponUsed: purchase.couponCode,
    purchaseDate: purchase.createdAt,
  }));

  return res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        { purchases: purchaseHistory },
        "Course purchase history retrieved successfully"
      )
    );
});

// Add an endpoint to get purchase statistics
export const getPurchaseStatistics = asyncHandler(async (req, res) => {
  const stats = await prisma.purchase.aggregate({
    _sum: {
      purchasePrice: true,
      discountPrice: true,
    },
    _count: {
      id: true,
    },
  });

  const courseStats = await prisma.purchase.groupBy({
    by: ["courseId"],
    _count: {
      id: true,
    },
    _sum: {
      purchasePrice: true,
    },
  });

  return res.status(200).json(
    new ApiResponsive(
      200,
      {
        totalPurchases: stats._count.id,
        totalRevenue: stats._sum.purchasePrice,
        totalDiscounts: stats._sum.discountPrice,
        courseWiseStats: courseStats,
      },
      "Purchase statistics retrieved successfully"
    )
  );
});
