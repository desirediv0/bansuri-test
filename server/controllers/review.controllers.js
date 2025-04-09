import { prisma } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";


// Create Review
export const createReview = asyncHandler(async (req, res) => {
  const { courseId, rating, comment } = req.body;
  const userId = req.user.id;

  // Check if course exists
  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  // Check if user is enrolled or purchased
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      userId,
      courseId,
    },
  });

  const purchase = await prisma.purchase.findFirst({
    where: {
      userId,
      courseId,
    },
  });

  if (!enrollment && !purchase) {
    throw new ApiError(403, "You must be enrolled in the course to review it");
  }

  // Check if user already reviewed
  const existingReview = await prisma.review.findFirst({
    where: {
      userId,
      courseId,
    },
  });

  if (existingReview) {
    throw new ApiError(400, "You have already reviewed this course");
  }

  const review = await prisma.review.create({
    data: {
      rating,
      comment,
      userId,
      courseId,
    },
    include: {
      user: {
        select: {
          name: true,
          email: true
        },
      },
    },
  });

  return res.status(201).json(
    new ApiResponsive(201, review, "Review created successfully")
  );
});

// Get Course Reviews
export const getCourseReviews = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  const reviews = await prisma.review.findMany({
    where: {
      courseId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return res.status(200).json(
    new ApiResponsive(200, reviews, "Reviews fetched successfully")
  );
});

// Get All Reviews (Admin)
export const getAllReviews = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search;

  const where = {
    ...(search && {
      OR: [
        { comment: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { course: { title: { contains: search, mode: 'insensitive' } } }
      ]
    })
  };

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        course: {
          select: {
            title: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.review.count({ where })
  ]);

  return res.status(200).json(
    new ApiResponsive(200, {
      reviews,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit
      }
    }, "Reviews fetched successfully")
  );
});

//  updateReview function
export const updateReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rating, comment } = req.body;
  const userId = req.user.id;

  const review = await prisma.review.findUnique({
    where: { id },
  });

  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  // Check ownership
  if (review.userId !== userId && !req.user.role === "ADMIN") {
    throw new ApiError(403, "Not authorized to update this review");
  }

  const updatedReview = await prisma.review.update({
    where: { id },
    data: {
      rating,
      comment,
      isEdited: true,
      updatedAt: new Date(),
    },
    include: {
      user: {
        select: {
          name: true,
          email: true
        },
      },
      course: {
        select: {
          title: true,
          slug: true,
        },
      },
    },
  });

  return res.status(200).json(
    new ApiResponsive(200, updatedReview, "Review updated successfully")
  );
});

// Delete Review
export const deleteReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const review = await prisma.review.findUnique({
    where: { id },
  });

  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  // Check ownership or admin
  if (review.userId !== userId && !req.user.isAdmin) {
    throw new ApiError(403, "Not authorized to delete this review");
  }

  await prisma.review.delete({
    where: { id },
  });

  return res.status(200).json(
    new ApiResponsive(200, null, "Review deleted successfully")
  );
});