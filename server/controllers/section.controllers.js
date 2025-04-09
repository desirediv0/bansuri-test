import { prisma } from "../config/db.js";
import { createSlug } from "../helper/Slug.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Create a new section
export const createSection = asyncHandler(async (req, res) => {
  const { courseSlug } = req.params;
  const { title, isPublished = false, isFree = false } = req.body;

  if (!title?.trim()) {
    throw new ApiError(400, "Title is required");
  }

  // First verify course exists
  const course = await prisma.course.findUnique({
    where: {
      slug: courseSlug,
    },
  });

  if (!course) {
    throw new ApiError(404, "Course not found");
  }
  // Get last position
  const lastSection = await prisma.section.findFirst({
    where: {
      courseId: course.id,
    },
    orderBy: {
      position: "desc",
    },
  });

  const position = lastSection ? lastSection.position + 1 : 1;

  // Create unique slug
  let slug = createSlug(title);
  let existingSlug = await prisma.section.findUnique({
    where: { slug },
  });
  let counter = 1;

  while (existingSlug) {
    slug = `${createSlug(title)}-${counter}`;
    existingSlug = await prisma.section.findUnique({ where: { slug } });
    counter++;
  }
  // Create section
  const section = await prisma.section.create({
    data: {
      title,
      slug,
      position,
      isPublished: Boolean(isPublished),
      isFree: Boolean(isFree),
      course: {
        connect: {
          id: course.id,
        },
      },
    },
    include: {
      chapters: true,
    },
  });

  return res
    .status(201)
    .json(new ApiResponsive(201, "Section created successfully", section));
});

// Get all sections for a course
export const getSections = asyncHandler(async (req, res) => {
  const { courseSlug } = req.params;

  const course = await prisma.course.findUnique({
    where: { slug: courseSlug },
    include: {
      sections: {
        include: {
          chapters: {
            orderBy: { position: "asc" },
          },
        },
        orderBy: { position: "asc" },
      },
    },
  });

  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponsive(200, course.sections, "Sections retrieved successfully")
    );
});
// Update a section
export const updateSection = asyncHandler(async (req, res) => {
  const { sectionSlug } = req.params;
  const { title } = req.body;

  if (!title?.trim()) {
    throw new ApiError(400, "Title is required");
  }

  const section = await prisma.section.findUnique({
    where: { slug: sectionSlug },
  });

  if (!section) {
    throw new ApiError(404, "Section not found");
  }

  const updatedSection = await prisma.section.update({
    where: { slug: sectionSlug },
    data: { title },
  });

  return res
    .status(200)
    .json(
      new ApiResponsive(200, "Section updated successfully", updatedSection)
    );
});

// Delete a section
export const deleteSection = asyncHandler(async (req, res) => {
  const { sectionSlug } = req.params;

  const section = await prisma.section.findUnique({
    where: { slug: sectionSlug },
    include: { chapters: true },
  });

  if (!section) {
    throw new ApiError(404, "Section not found");
  }

  // Delete section and its chapters (cascade delete)
  await prisma.section.delete({
    where: { slug: sectionSlug },
  });

  // Reorder remaining sections
  const remainingSections = await prisma.section.findMany({
    where: { courseId: section.courseId, position: { gt: section.position } },
  });

  for (const sec of remainingSections) {
    await prisma.section.update({
      where: { id: sec.id },
      data: { position: sec.position - 1 },
    });
  }

  return res
    .status(200)
    .json(new ApiResponsive(200, "Section deleted successfully"));
});

// Reorder sections
export const reorderSections = asyncHandler(async (req, res) => {
  const { courseSlug } = req.params;
  const { sections } = req.body;

  if (!Array.isArray(sections)) {
    throw new ApiError(400, "Invalid sections array");
  }

  const course = await prisma.course.findUnique({
    where: { slug: courseSlug },
  });

  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  // Update all positions in a transaction
  await prisma.$transaction(
    sections.map((section) =>
      prisma.section.update({
        where: {
          id: section.id,
          courseId: course.id,
        },
        data: {
          position: section.position,
        },
      })
    )
  );

  return res
    .status(200)
    .json(new ApiResponsive(200, "Sections reordered successfully"));
});

// Toggle section publish status
export const toggleSectionPublish = asyncHandler(async (req, res) => {
  const { sectionSlug } = req.params;

  const section = await prisma.section.findUnique({
    where: { slug: sectionSlug },
  });

  if (!section) {
    throw new ApiError(404, "Section not found");
  }

  const updatedSection = await prisma.section.update({
    where: { slug: sectionSlug },
    data: { isPublished: !section.isPublished },
  });

  return res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        `Section ${
          updatedSection.isPublished ? "published" : "unpublished"
        } successfully`,
        updatedSection
      )
    );
});

// Toggle section free status
export const toggleSectionFree = asyncHandler(async (req, res) => {
  const { sectionSlug } = req.params;

  const section = await prisma.section.findUnique({
    where: { slug: sectionSlug },
  });

  if (!section) {
    throw new ApiError(404, "Section not found");
  }

  const updatedSection = await prisma.section.update({
    where: { slug: sectionSlug },
    data: { isFree: !section.isFree },
  });

  return res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        `Section ${
          updatedSection.isFree ? "made free" : "made paid"
        } successfully`,
        updatedSection
      )
    );
});
