import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const enrollCourse = asyncHandler(async (req, res) => {
  const { courseId } = req.body;
  const userId = req.user.id;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  try {
    const enrollment = await prisma.enrollment.create({
      data: {
        userId,
        courseId,
      },
    });

    return res
      .status(201)
      .json(
        new ApiResponsive(201, "Enrolled in course successfully", enrollment)
      );
  } catch (error) {
    if (error.code === "P2002") {
      // Unique constraint failed
      return res
        .status(200)
        .json(new ApiResponsive(200, "Already enrolled in course"));
    } else {
      throw new ApiError(
        500,
        "An error occurred while enrolling in the course"
      );
    }
  }
});

export const checkEnrollment = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const courseId = req.params.id;

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      userId,
      courseId,
    },
  });

  if (!enrollment) {
    return res
      .status(200)
      .json(new ApiResponsive(200, "Not enrolled in course"));
  }

  return res
    .status(200)
    .json(new ApiResponsive(200, enrollment, "Enrolled in course"));
});

export const getUserEnrollments = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const enrollments = await prisma.enrollment.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      course: {
        include: {
          category: true,
        },
      },
    },
  });

  return res
    .status(200)
    .json(new ApiResponsive(200, enrollments, "User enrollments"));
});
