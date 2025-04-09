import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Grant access to specific users
export const grantCourseAccess = asyncHandler(async (req, res) => {
    const { courseId, userIds } = req.body;

    if (!courseId || !userIds || !Array.isArray(userIds)) {
        throw new ApiError(400, "Please provide courseId and array of userIds");
    }

    // Verify course exists
    const course = await prisma.course.findUnique({
        where: { id: courseId }
    });

    if (!course) {
        throw new ApiError(404, "Course not found");
    }

    // Update course to private
    await prisma.course.update({
        where: { id: courseId },
        data: { isPublic: false }
    });

    // Create visibility records for each user
    const visibility = await prisma.$transaction(
        userIds.map((userId) =>
            prisma.courseVisibility.create({
                data: {
                    courseId,
                    userId
                }
            })
        )
    );

    return res.status(200).json(
        new ApiResponsive(200, {
            message: "Course access granted successfully",
            visibility
        })
    );
});

// Revoke access from specific users
export const revokeCourseAccess = asyncHandler(async (req, res) => {
    const { courseId, userIds } = req.body;

    if (!courseId || !userIds || !Array.isArray(userIds)) {
        throw new ApiError(400, "Please provide courseId and array of userIds");
    }

    await prisma.courseVisibility.deleteMany({
        where: {
            courseId,
            userId: { in: userIds }
        }
    });

    return res.status(200).json(
        new ApiResponsive(200, "Course access revoked successfully")
    );
});

// Get all users with access to a course
export const getCourseAccessList = asyncHandler(async (req, res) => {
    const { courseId } = req.params;

    const accessList = await prisma.courseVisibility.findMany({
        where: { courseId },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            }
        }
    });

    return res.status(200).json(
        new ApiResponsive(200, accessList)
    );
});

// Modify the existing getCourses controller to check visibility
export const getVisibleCourses = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const courses = await prisma.course.findMany({
        where: {
            OR: [
                { isPublic: true },
                {
                    visibleTo: {
                        some: {
                            userId
                        }
                    }
                }
            ]
        },
        include: {
            category: true
        }
    });

    return res.status(200).json(
        new ApiResponsive(200, courses)
    );
});