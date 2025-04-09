import { prisma } from "../config/db.js";
import { SendEmail } from "../email/SendEmail.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { nanoid } from "nanoid";

export const markChapterComplete = asyncHandler(async (req, res) => {
  const { chapterId } = req.body;
  const userId = req.user.id;

  if (!chapterId) {
    throw new ApiError(400, "Chapter ID is required");
  }

  try {
    // First check if the chapter exists
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        section: {
          include: {
            course: true
          }
        }
      }
    });

    if (!chapter) {
      throw new ApiError(404, "Chapter not found");
    }

    // Mark chapter as complete using upsert to avoid duplicates
    const progress = await prisma.userProgress.upsert({
      where: {
        userId_chapterId: {
          userId,
          chapterId
        }
      },
      update: {
        isCompleted: true,
        completedAt: new Date(),
        watchedTime: 100
      },
      create: {
        userId,
        chapterId,
        isCompleted: true,
        completedAt: new Date(),
        watchedTime: 100,
        lastAccessed: new Date()
      }
    });

    const courseId = chapter.section.course.id;

    // Check if course is completed and generate certificate if needed
    const certificate = await checkAndGenerateCertificate(
      userId,
      courseId,
      req.user.email,
      req.user.name
    );

    const response = {
      progress,
      ...(certificate && {
        certificate: {
          id: certificate.certificateId,
          courseTitle: chapter.section.course.title
        }
      })
    };

    return res.status(200).json(
      new ApiResponsive(
        200,
        response,
        certificate ? "Chapter completed and certificate generated" : "Chapter marked as complete"
      )
    );
  } catch (error) {
    console.error("Error marking chapter complete:", error);
    throw new ApiError(500, error.message || "Failed to mark chapter as complete");
  }
});

export const updateProgress = asyncHandler(async (req, res) => {
  const { chapterId, watchedTime } = req.body;
  const userId = req.user.id;

  if (!chapterId) {
    throw new ApiError(400, "Chapter ID is required");
  }

  try {
    // First check if the chapter exists
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId }
    });

    if (!chapter) {
      throw new ApiError(404, "Chapter not found");
    }

    // Now update or create progress
    const progress = await prisma.userProgress.upsert({
      where: {
        userId_chapterId: {
          userId,
          chapterId
        }
      },
      update: {
        watchedTime: parseFloat(watchedTime || 0),
        lastAccessed: new Date()
      },
      create: {
        userId,
        chapterId,
        watchedTime: parseFloat(watchedTime || 0),
        isCompleted: false,
        lastAccessed: new Date()
      }
    });

    // If watched more than 90%, mark as completed
    if (parseFloat(watchedTime) >= 90 && !progress.isCompleted) {
      await prisma.userProgress.update({
        where: { id: progress.id },
        data: {
          isCompleted: true,
          completedAt: new Date()
        }
      });
    }

    return res.status(200).json(
      new ApiResponsive(200, progress, "Progress updated successfully")
    );
  } catch (error) {
    console.error("Progress update error:", error);
    throw new ApiError(500, error.message || "Failed to update progress");
  }
});

// Helper function to check course completion and generate certificate
const checkAndGenerateCertificate = async (userId, courseId, userEmail, userName) => {
  const totalChapters = await prisma.chapter.count({
    where: {
      section: {
        courseId
      }
    }
  });

  const completedChapters = await prisma.userProgress.count({
    where: {
      userId,
      chapter: {
        section: {
          courseId
        }
      },
      isCompleted: true
    }
  });

  if (totalChapters === completedChapters) {
    const existingCertificate = await prisma.courseCompletion.findFirst({
      where: {
        userId,
        courseId
      }
    });

    if (!existingCertificate) {
      const certificate = await prisma.courseCompletion.create({
        data: {
          userId,
          courseId,
          certificateId: nanoid(10),
          grade: "Pass"
        },
        include: {
          user: true,
          course: true
        }
      });

      // Send email notification
      if (userEmail && userName) {
        await SendEmail({
          email: userEmail,
          subject: "Course Completion Certificate - Bansuri Vidya Mandir ",
          emailType: "CERTIFICATE_GENERATED",
          message: {
            userName: userName,
            courseName: certificate.course.title,
            certificateId: certificate.certificateId
          }
        });
      }

      return certificate;
    }
  }
  return null;
};

export const getCourseProgress = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user.id;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      sections: {
        include: {
          chapters: {
            include: {
              userProgress: {
                where: { userId }
              }
            }
          }
        }
      }
    }
  });

  if (!course) throw new ApiError(404, "Course not found");

  // Get all chapters
  const allChapters = course.sections.flatMap(section => section.chapters);
  const totalChapters = allChapters.length;

  // Get completed chapters
  const completedChapters = allChapters.filter(
    chapter => chapter.userProgress.some(progress => progress.isCompleted)
  );

  const completedChapterIds = completedChapters.map(chapter => chapter.id);
  const completedCount = completedChapters.length;
  const percentage = totalChapters > 0 ? Math.round((completedCount / totalChapters) * 100) : 0;

  const progress = {
    percentage,
    completedChapters: completedChapterIds,
    totalChapters,
    completedCount
  };

  return res.status(200).json(
    new ApiResponsive(200, progress, "Course progress retrieved successfully")
  );
});

// Helper function
const calculateCourseProgress = async (userId, courseId) => {
  const progress = await prisma.chapter.count({
    where: {
      courseId,
      userProgress: {
        some: {
          userId,
          isCompleted: true
        }
      }
    }
  });

  const total = await prisma.chapter.count({
    where: { courseId }
  });

  return {
    completed: progress,
    total,
    percentage: Math.round((progress / total) * 100)
  };
};
export const getProgress = asyncHandler(async (req, res) => {
  const { chapterId } = req.params;
  const userId = req.user.id;

  // Get chapter with progress
  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    include: {
      section: {
        include: {
          course: true
        }
      },
      userProgress: {
        where: { userId }
      }
    }
  });

  if (!chapter) {
    throw new ApiError(404, "Chapter not found");
  }

  // Get progress or create default
  const progress = chapter.userProgress[0] || {
    isCompleted: false,
    watchedTime: 0,
    notes: null,
    bookmarked: false,
    lastAccessed: null
  };

  // Get next chapter if exists
  const nextChapter = await prisma.chapter.findFirst({
    where: {
      sectionId: chapter.sectionId,
      position: {
        gt: chapter.position
      }
    },
    orderBy: {
      position: 'asc'
    }
  });

  return res.status(200).json(
    new ApiResponsive(200, {
      chapterId,
      title: chapter.title,
      courseId: chapter.section.courseId,
      progress: {
        isCompleted: progress.isCompleted,
        watchedTime: progress.watchedTime,
        notes: progress.notes,
        bookmarked: progress.bookmarked,
        lastAccessed: progress.lastAccessed
      },
      nextChapterId: nextChapter?.id || null,
      courseProgress: await calculateCourseProgress(userId, chapter.section.courseId)
    }, "Progress retrieved successfully")
  );
});