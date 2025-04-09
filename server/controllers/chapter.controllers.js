import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createSlug } from "../helper/Slug.js";
import { deleteFile } from "../middlewares/multer.middlerware.js";
import { deleteFromS3 } from "../utils/deleteFromS3.js";

const findChapter = async (slug) => {
  const chapter = await prisma.chapter.findUnique({
    where: { slug },
  });

  if (!chapter) {
    throw new Error("Chapter not found");
  }

  return chapter;
};

// Controllers
export const createChapter = asyncHandler(async (req, res) => {
  const { title, description, videoUrl } = req.body;
  const { sectionSlug } = req.params;
  let pdfUrl = null;
  let audioUrl = null;

  try {
    if (!title || !description || !sectionSlug) {
      throw new ApiError(400, "Title, description, and section are required");
    }

    // Find section
    const section = await prisma.section.findUnique({
      where: { slug: sectionSlug },
    });

    if (!section) {
      throw new ApiError(404, "Section not found");
    }

    // Get last position in this section
    const lastChapter = await prisma.chapter.findFirst({
      where: { sectionId: section.id },
      orderBy: { position: "desc" },
    });

    // Create slug
    let baseSlug = createSlug(title);
    let uniqueSlug = baseSlug;
    let counter = 1;
    while (await prisma.chapter.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Handle file uploads
    if (req.files) {
      // Process PDF if uploaded
      if (req.files.pdf && req.files.pdf[0]) {
        pdfUrl = req.files.pdf[0].filename;
      }

      // Process audio if uploaded
      if (req.files.audio && req.files.audio[0]) {
        audioUrl = req.files.audio[0].filename;
      }
    }

    // Handle direct URLs from request body
    if (req.body.pdfUrl && !pdfUrl) {
      pdfUrl = req.body.pdfUrl;
    }

    if (req.body.audioUrl && !audioUrl) {
      audioUrl = req.body.audioUrl;
    }

    // Parse boolean values correctly
    const isFree = req.body.isFree === "true";
    const isPublished = req.body.isPublished === "true";

    // Create chapter
    const chapter = await prisma.chapter.create({
      data: {
        title,
        description,
        slug: uniqueSlug,
        sectionId: section.id,
        videoUrl: videoUrl || null,
        pdfUrl,
        audioUrl,
        position: lastChapter ? lastChapter.position + 1 : 1,
        isFree,
        isPublished,
      },
    });

    return res
      .status(201)
      .json(new ApiResponsive(201, "Chapter created successfully", chapter));
  } catch (error) {
    // Clean up uploaded files in case of error
    if (pdfUrl) await deleteFile(pdfUrl);
    if (audioUrl) await deleteFile(audioUrl);
    throw error;
  }
});

export const getChapters = asyncHandler(async (req, res) => {
  const { sectionSlug } = req.params;

  if (!sectionSlug) {
    throw new ApiError(400, "Please provide section slug");
  }

  const section = await prisma.section.findUnique({
    where: { slug: sectionSlug },
    include: {
      chapters: {
        orderBy: { position: "asc" },
        videoUrl: false,
      },
    },
  });

  if (!section) {
    throw new ApiError(404, "Section not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        "Chapters retrieved successfully",
        section.chapters
      )
    );
});

export const getChapter = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  if (!slug) {
    throw new ApiError(400, "Please provide slug");
  }

  const chapter = await findChapter(slug);

  return res
    .status(200)
    .json(new ApiResponsive(200, "Chapter retrieved successfully", chapter));
});

export const updateChapter = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const { title, description, videoUrl } = req.body;
  let pdfUrl = null;
  let audioUrl = null;
  let filesToDelete = [];

  try {
    if (!slug) {
      throw new ApiError(400, "Please provide slug");
    }

    // Get existing chapter
    const existingChapter = await findChapter(slug);

    // Build update data
    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (videoUrl !== undefined) updateData.videoUrl = videoUrl || null;

    // Parse boolean values correctly
    if (req.body.isFree !== undefined) updateData.isFree = req.body.isFree === "true";
    if (req.body.isPublished !== undefined) updateData.isPublished = req.body.isPublished === "true";

    // Handle file uploads
    if (req.files) {
      // Process PDF if uploaded
      if (req.files.pdf && req.files.pdf[0]) {
        pdfUrl = req.files.pdf[0].filename;
        updateData.pdfUrl = pdfUrl;
        if (existingChapter.pdfUrl) {
          filesToDelete.push(existingChapter.pdfUrl);
        }
      }

      // Process audio if uploaded
      if (req.files.audio && req.files.audio[0]) {
        audioUrl = req.files.audio[0].filename;
        updateData.audioUrl = audioUrl;
        if (existingChapter.audioUrl) {
          filesToDelete.push(existingChapter.audioUrl);
        }
      }
    }

    // Handle direct URLs from request body - ensure old files are deleted first
    if (req.body.pdfUrl !== undefined) {
      // If pdfUrl is changing, delete the old one
      if (existingChapter.pdfUrl && existingChapter.pdfUrl !== req.body.pdfUrl) {
        filesToDelete.push(existingChapter.pdfUrl);
      }
      updateData.pdfUrl = req.body.pdfUrl;
    }

    if (req.body.audioUrl !== undefined) {
      // If audioUrl is changing, delete the old one
      if (existingChapter.audioUrl && existingChapter.audioUrl !== req.body.audioUrl) {
        filesToDelete.push(existingChapter.audioUrl);
      }
      updateData.audioUrl = req.body.audioUrl;
    }

    // Delete old files from S3 before updating the database
    for (const fileUrl of filesToDelete) {
      try {
        await deleteFromS3(fileUrl);
        console.log(`Successfully deleted file from S3: ${fileUrl}`);
      } catch (err) {
        console.error(`Error deleting file ${fileUrl} from S3:`, err);
      }
    }

    // Update chapter in database after files are deleted from S3
    const updatedChapter = await prisma.chapter.update({
      where: { slug },
      data: updateData,
    });

    return res
      .status(200)
      .json(
        new ApiResponsive(200, "Chapter updated successfully", updatedChapter)
      );
  } catch (error) {
    // Clean up newly uploaded files in case of error
    if (pdfUrl) await deleteFile(pdfUrl);
    if (audioUrl) await deleteFile(audioUrl);
    throw error;
  }
});

export const chapterPublishToggle = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  if (!slug) {
    throw new ApiError(400, "Please provide slug");
  }

  const chapter = await findChapter(slug);

  const updatedChapter = await prisma.chapter.update({
    where: { slug },
    data: { isPublished: !chapter.isPublished },
  });

  return res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        "Chapter publish status updated successfully",
        updatedChapter
      )
    );
});

export const chapterFreeToggle = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  if (!slug) {
    throw new ApiError(400, "Please provide slug");
  }

  const chapter = await findChapter(slug);

  const updatedChapter = await prisma.chapter.update({
    where: { slug },
    data: { isFree: !chapter.isFree },
  });

  return res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        "Chapter free status updated successfully",
        updatedChapter
      )
    );
});

export const chapterProgress = asyncHandler(async (req, res) => {
  const { userId, slug, isCompleted } = req.body;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  await findChapter(slug);

  const userProgress = await prisma.userProgress.upsert({
    where: {
      userId_slug: {
        userId,
        slug,
      },
    },
    update: {
      isCompleted: isCompleted !== undefined ? isCompleted : false,
    },
    create: {
      userId,
      slug,
      isCompleted: isCompleted || false,
    },
  });

  return res
    .status(200)
    .json(new ApiResponsive(200, "Progress updated", userProgress));
});

export const getDraftChapters = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    const skip = (page - 1) * limit;

    const [chapters, totalchapters] = await Promise.all([
      prisma.chapter.findMany({
        where: { isPublished: false },
        skip,
        take: limit,
      }),
      prisma.chapter.count({ where: { isPublished: false } }),
    ]);

    return res.status(200).json(
      new ApiResponsive(200, "chapters retrieved successfully", {
        chapters,
        totalPages: Math.ceil(totalchapters / limit),
        currentPage: page,
      })
    );
  } catch (error) {
    console.error("Error retrieving draft chapters:", error);
    return res
      .status(500)
      .json(new ApiError(500, "Failed to retrieve draft chapters"));
  }
});

export const getChapterVideoUrl = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  if (!slug) {
    throw new ApiError(400, "Please provide slug");
  }

  const chapter = await findChapter(slug);

  if (!chapter.videoUrl) {
    throw new ApiError(404, "Video not found");
  }

  return res
    .status(200)
    .json(new ApiResponsive(200, "Chapter video retrieved", chapter.videoUrl));
});

export const deleteChapter = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  if (!slug) {
    throw new ApiError(400, "Please provide slug");
  }

  // Find chapter with correct relationship name
  const chapter = await prisma.chapter.findUnique({
    where: { slug },
    include: { section: true },
  });

  if (!chapter) {
    throw new ApiError(404, "Chapter not found");
  }

  // Get files to delete
  const filesToDelete = [];
  if (chapter.videoUrl) filesToDelete.push(chapter.videoUrl);
  if (chapter.pdfUrl) filesToDelete.push(chapter.pdfUrl);
  if (chapter.audioUrl) filesToDelete.push(chapter.audioUrl);

  // Start transaction for delete and reorder
  await prisma.$transaction(async (tx) => {
    // Delete the chapter
    await tx.chapter.delete({
      where: { slug },
    });

    // Get and update remaining chapters
    const remainingChapters = await tx.chapter.findMany({
      where: {
        sectionId: chapter.sectionId,
        position: { gt: chapter.position },
      },
      orderBy: { position: "asc" },
    });

    // Update positions
    for (const ch of remainingChapters) {
      await tx.chapter.update({
        where: { id: ch.id },
        data: { position: ch.position - 1 },
      });
    }
  });

  // Delete files from storage using deleteFromS3 instead of deleteFile
  for (const fileUrl of filesToDelete) {
    await deleteFromS3(fileUrl).catch(err =>
      console.error(`Error deleting file ${fileUrl} from S3:`, err)
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        "Chapter deleted and positions reordered successfully"
      )
    );
});

// Add this function to cascade delete for course
export const cleanupChapterFiles = async (chapterId) => {
  try {
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: { videoUrl: true, pdfUrl: true, audioUrl: true }
    });

    if (!chapter) return;

    // Delete all associated files using deleteFromS3
    if (chapter.videoUrl) await deleteFromS3(chapter.videoUrl).catch(console.error);
    if (chapter.pdfUrl) await deleteFromS3(chapter.pdfUrl).catch(console.error);
    if (chapter.audioUrl) await deleteFromS3(chapter.audioUrl).catch(console.error);

  } catch (error) {
    console.error(`Error cleaning up chapter ${chapterId} files:`, error);
  }
};

export const reorderChapters = asyncHandler(async (req, res) => {
  const { sectionSlug } = req.params;
  const { chapters } = req.body;

  if (!Array.isArray(chapters)) {
    throw new ApiError(400, "Invalid chapters array");
  }

  const section = await prisma.section.findUnique({
    where: { slug: sectionSlug },
  });

  if (!section) {
    throw new ApiError(404, "Section not found");
  }

  // Update all positions in a transaction with ordered array
  await prisma.$transaction(
    chapters.map((chapter, index) =>
      prisma.chapter.update({
        where: {
          id: chapter.id,
          sectionId: section.id,
        },
        data: { position: index + 1 },
      })
    )
  );

  // Fetch updated chapters
  const updatedChapters = await prisma.chapter.findMany({
    where: { sectionId: section.id },
    orderBy: { position: "asc" },
  });

  return res
    .status(200)
    .json(
      new ApiResponsive(200, "Chapters reordered successfully", updatedChapters)
    );
});

export const getAllChapterBySectionSlug = asyncHandler(async (req, res) => {
  const { sectionSlug } = req.params;

  if (!sectionSlug) {
    throw new ApiError(400, "Please provide section slug");
  }

  const section = await prisma.section.findUnique({
    where: { slug: sectionSlug },
    include: {
      chapters: {
        orderBy: { position: "asc" },
      },
    },
  });

  if (!section) {
    throw new ApiError(404, "Section not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        "Chapters retrieved successfully",
        section.chapters
      )
    );
});
