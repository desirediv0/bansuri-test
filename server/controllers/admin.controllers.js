import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getAdminDashboardData = asyncHandler(async (req, res) => {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            usertype: true,
            isVerified: true,
            purchases: {
                select: {
                    id: true,
                    course: {
                        select: {
                            id: true,
                            title: true,
                            price: true,
                            salePrice: true,
                        }
                    }
                }
            },
            enrollments: {
                select: {
                    id: true,
                    course: {
                        select: {
                            id: true,
                            title: true,
                            paid: true,
                        }
                    }
                }
            }
        },
    });

    const courses = await prisma.course.findMany({
        where: {
            isPublished: true, // Only get published courses
        },
        select: {
            id: true,
            title: true,
            price: true,
            salePrice: true,
            paid: true,
            language: true,
            category: {
                select: {
                    name: true
                }
            }
        }
    });

    return res.status(200).json(
        new ApiResponsive(200, { users, courses }, "Dashboard data fetched successfully")
    );
});

export const assignCourseToUser = asyncHandler(async (req, res) => {
    const { userId, courseId } = req.body;

    if (!userId || !courseId) {
        throw new ApiError(400, "Please provide both user ID and course ID");
    }

    const course = await prisma.course.findUnique({
        where: { id: courseId }
    });

    if (!course) {
        throw new ApiError(404, "Course not found");
    }

    // Begin transaction
    await prisma.$transaction(async (tx) => {
        // If course is paid, create a purchase record
        if (course.paid) {
            await tx.purchase.create({
                data: {
                    userId,
                    courseId,
                    purchasePrice: course.salePrice || course.price,
                    discountPrice: course.salePrice ? course.price - course.salePrice : 0
                }
            });
        }

        // Create enrollment
        await tx.enrollment.create({
            data: {
                userId,
                courseId
            }
        });
    });

    return res.status(200).json(
        new ApiResponsive(200, null, "Course assigned successfully")
    );
});

export const assignBulkCoursesToUsers = asyncHandler(async (req, res) => {
    const { assignments } = req.body;
    // assignments should be an array of { userId, courseIds[] }

    if (!assignments || !Array.isArray(assignments)) {
        throw new ApiError(400, "Invalid assignment data");
    }

    for (const assignment of assignments) {
        const { userId, courseIds } = assignment;

        if (!userId || !courseIds || !Array.isArray(courseIds)) {
            throw new ApiError(400, "Invalid assignment format");
        }

        const courses = await prisma.course.findMany({
            where: { id: { in: courseIds } }
        });

        // Begin transaction for each user
        await prisma.$transaction(async (tx) => {
            for (const course of courses) {
                // Check if enrollment already exists
                const existingEnrollment = await tx.enrollment.findFirst({
                    where: {
                        userId,
                        courseId: course.id
                    }
                });

                if (!existingEnrollment) {
                    // If course is paid, create a purchase record
                    if (course.paid) {
                        await tx.purchase.create({
                            data: {
                                userId,
                                courseId: course.id,
                                purchasePrice: course.salePrice || course.price,
                                discountPrice: course.salePrice ? course.price - course.salePrice : 0
                            }
                        });
                    }

                    // Create enrollment
                    await tx.enrollment.create({
                        data: {
                            userId,
                            courseId: course.id
                        }
                    });
                }
            }
        });
    }

    return res.status(200).json(
        new ApiResponsive(200, null, "Courses assigned successfully")
    );
});

// Add new controller for removing access
export const removeCourseAccess = asyncHandler(async (req, res) => {
    const { userId, courseId } = req.body;

    if (!userId || !courseId) {
        throw new ApiError(400, "Please provide both user ID and course ID");
    }

    await prisma.$transaction(async (tx) => {
        // Remove enrollment
        await tx.enrollment.deleteMany({
            where: {
                userId,
                courseId
            }
        });

        // Remove purchase if exists
        await tx.purchase.deleteMany({
            where: {
                userId,
                courseId
            }
        });
    });

    return res.status(200).json(
        new ApiResponsive(200, null, "Course access removed successfully")
    );
});