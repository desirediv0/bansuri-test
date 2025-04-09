import { prisma } from "../config/db.js";
import { createSlug } from "../helper/Slug.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getFileUrl, deleteFile } from "../middlewares/multer.middlerware.js";
import { deleteFromS3 } from "../utils/deleteFromS3.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_DIR = path.join(__dirname, "../public/upload");

const validateCourseData = (title, description) => {
  if (!title?.trim() || !description?.trim()) {
    throw new ApiError(
      400,
      "Please provide all required fields (title, description)"
    );
  }
};

const findCourseBySlug = async (slug) => {
  const course = await prisma.course.findUnique({
    where: { slug },
  });
  if (!course) {
    throw new ApiError(404, "Course not found");
  }
  return course;
};

const handleFileUpload = (file) => {
  if (!file) {
    throw new ApiError(400, "Invalid file upload");
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.mimetype)) {
    throw new ApiError(400, "Invalid file type. Only JPG, PNG and WebP allowed");
  }

  // Validate file size (e.g., 5MB limit)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw new ApiError(400, "File too large. Maximum size is 5MB");
  }

  return file.filename;
};

const createMetaDescription = (description) => {
  if (!description) return "";

  const cleanText = description
    .replace(/<[^>]*>/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleanText.length > 160
    ? cleanText.substring(0, 160) + "..."
    : cleanText;
};

export const createCourse = asyncHandler(async (req, res) => {
  let uploadedThumbnail = null;
  try {
    if (req.files && req.files.thumbnail && req.files.thumbnail[0]) {
      uploadedThumbnail = req.files.thumbnail[0].filename;
    }

    const {
      title,
      description,
      price,
      salePrice,
      isPublished,
      language,
      subheading,
      videoUrl,
      slug,
      paid,
      isFeatured,
      isPopular,
      isTrending,
      isBestseller,
      categoryId
    } = req.body;

    // Get meta fields separately
    let { metaTitle, metaDesc } = req.body;

    validateCourseData(title, description);

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Validate category
    if (!categoryId) {
      throw new ApiError(400, "Category is required");
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      throw new ApiError(400, "Invalid category");
    }

    // Generate meta fields
    const finalMetaTitle = metaTitle || title;
    const finalMetaDesc = metaDesc || createMetaDescription(description);

    // Create unique slug
    let uniqueSlug = slug ? createSlug(slug) : createSlug(title);
    let existingSlug = await prisma.course.findUnique({
      where: { slug: uniqueSlug },
    });
    let counter = 1;

    while (existingSlug) {
      uniqueSlug = `${createSlug(slug || title)}-${counter}`;
      existingSlug = await prisma.course.findUnique({
        where: { slug: uniqueSlug },
      });
      counter++;
    }

    const parseBooleanField = (field) => {
      if (field === "true" || field === true) return true;
      if (field === "false" || field === false) return false;
      return false;
    };

    const course = await prisma.course.create({
      data: {
        title: title.trim(),
        description: description,
        slug: uniqueSlug,
        price: price ? parseFloat(price) : 0,
        salePrice: salePrice ? parseFloat(salePrice) : 0,
        thumbnail: uploadedThumbnail,
        userId: req.user.id,
        isPublished: parseBooleanField(isPublished),
        language: language,
        subheading: subheading?.trim(),
        metaTitle: finalMetaTitle.trim(),
        metaDesc: finalMetaDesc.trim(),
        isFeatured: parseBooleanField(isFeatured),
        isPopular: parseBooleanField(isPopular),
        isTrending: parseBooleanField(isTrending),
        isBestseller: parseBooleanField(isBestseller),
        videoUrl,
        paid: parseBooleanField(paid),
        categoryId
      },
    });

    return res
      .status(201)
      .json(new ApiResponsive(201, "Course created successfully", course));
  } catch (error) {
    if (uploadedThumbnail) {
      await deleteFile(uploadedThumbnail);
    }
    throw error;
  }
});

export const getCourses = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 12;
  const skip = (page - 1) * limit;
  const search = req.query.search;
  const category = req.query.category;
  const sort = req.query.sort;

  const where = {
    isPublished: true,
    ...(search && {
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } }
      ]
    }),
    ...(category && category !== "all" && { categoryId: category })
  };

  let orderBy = {};
  switch (sort) {
    case "oldest":
      orderBy = { createdAt: "asc" };
      break;
    case "price_high":
      orderBy = [
        { salePrice: "desc" },
        { price: "desc" }
      ];
      break;
    case "price_low":
      orderBy = [
        { salePrice: "asc" },
        { price: "asc" }
      ];
      break;
    default:
      orderBy = { createdAt: "desc" };
  }

  const [courses, totalCourses] = await Promise.all([
    prisma.course.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    }),
    prisma.course.count({ where })
  ]);

  // Sort courses after fetching based on effective price
  if (sort === "price_high" || sort === "price_low") {
    courses.sort((a, b) => {
      const priceA = a.salePrice > 0 ? a.salePrice : a.price;
      const priceB = b.salePrice > 0 ? b.salePrice : b.price;
      return sort === "price_high" ? priceB - priceA : priceA - priceB;
    });
  }

  return res.status(200).json(
    new ApiResponsive(200, {
      courses,
      totalPages: Math.ceil(totalCourses / limit),
      currentPage: page
    })
  );
});

export const getCourseall = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const course = await prisma.section.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      sections: {
        select: {
          id: true,
          slug: true,
          position: true,
          chapters: {
            select: {
              id: true,
              title: true,
              description: true,
              isFree: true,
              position: true,
              videoUrl: true,
            },
            orderBy: {
              position: "asc",
            },
          },
        },
        orderBy: {
          position: "asc",
        },
      },
    },
  });

  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  return res
    .status(200)
    .json(new ApiResponsive(200, "Course retrieved successfully", course));
});

export const getCourse = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const course = await prisma.course.findUnique({
    where: { slug },
    select: {
      id: true,
      title: true,
      description: true,
      thumbnail: true,
      price: true,
      salePrice: true,
      slug: true,
      paid: true,
      isBestseller: true,
      isTrending: true,
      isPopular: true,
      isFeatured: true,
      videoUrl: true,
      language: true,
      isPublished: true,
      isPublic: true,
      createdAt: true,
      updatedAt: true,
      metaDesc: true,
      metaTitle: true,
      subheading: true,
      categoryId: true,
      userId: true,

      // Add category with required fields
      category: {
        select: {
          id: true,
          name: true
        }
      },

      sections: {
        orderBy: {
          position: "asc",
        },
        select: {
          id: true,
          title: true,
          position: true,
          isPublished: true,
          isFree: true,
          slug: true,
          courseId: true,
          createdAt: true,
          updatedAt: true,
          chapters: {
            orderBy: {
              position: "asc",
            },
            select: {
              id: true,
              title: true,
              description: true,
              position: true,
              isPublished: true,
              isFree: true,
              slug: true,
              pdfUrl: true,
              audioUrl: true,
              sectionId: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      }
    },
  });

  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  return res
    .status(200)
    .json(new ApiResponsive(200, course, "Course retrieved successfully"));
});

export const deleteCourse = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  // First, get the course with all its sections and chapters to access their files
  const course = await prisma.course.findUnique({
    where: { slug },
    select: {
      id: true,
      thumbnail: true,
      sections: {
        select: {
          id: true,
          chapters: {
            select: {
              id: true,
              videoUrl: true,
              pdfUrl: true,
              audioUrl: true
            }
          }
        }
      }
    }
  });

  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  // Collection of all files to delete
  const filesToDelete = [];

  // Add course thumbnail if exists
  if (course.thumbnail) {
    filesToDelete.push(course.thumbnail);
  }

  // Add all chapter files
  for (const section of course.sections) {
    for (const chapter of section.chapters) {
      if (chapter.videoUrl) filesToDelete.push(chapter.videoUrl);
      if (chapter.pdfUrl) filesToDelete.push(chapter.pdfUrl);
      if (chapter.audioUrl) filesToDelete.push(chapter.audioUrl);
    }
  }

  // Delete database records
  await prisma.$transaction(async (tx) => {
    // First, delete related enrollments
    await tx.enrollment.deleteMany({
      where: { courseId: course.id }
    });

    // Then, delete related course completions
    await tx.courseCompletion.deleteMany({
      where: { courseId: course.id }
    });

    // Delete certificates
    await tx.certificate.deleteMany({
      where: { courseId: course.id }
    });

    // Delete the course (will cascade delete sections and chapters)
    await tx.course.delete({
      where: { id: course.id },
    });
  });

  // Delete all files from storage
  for (const file of filesToDelete) {
    await deleteFile(file).catch(err => console.error(`Error deleting file ${file}:`, err));
  }

  return res
    .status(200)
    .json(
      new ApiResponsive(200, "Course and all related content deleted successfully")
    );
});

export const updateCourseImage = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  // Check if file exists
  if (!req.files || !req.files.thumbnail || !req.files.thumbnail[0]) {
    throw new ApiError(400, "No image file provided");
  }

  // Get existing course
  const existingCourse = await prisma.course.findUnique({
    where: { slug },
    select: {
      thumbnail: true,
      id: true
    }
  });

  if (!existingCourse) {
    throw new ApiError(404, "Course not found");
  }

  try {
    // Lock the course for update to prevent concurrent modifications
    const updatedCourse = await prisma.$transaction(async (tx) => {
      // Delete old thumbnail if exists
      if (existingCourse.thumbnail) {
        await deleteFile(existingCourse.thumbnail);
      }

      // Get new thumbnail filename
      const thumbnail = req.files.thumbnail[0].filename;

      // Update course with new thumbnail
      return await tx.course.update({
        where: { id: existingCourse.id },
        data: { thumbnail }
      });
    });

    return res.status(200).json(
      new ApiResponsive(200, "Course thumbnail updated successfully", {
        thumbnail: updatedCourse.thumbnail
      })
    );

  } catch (error) {
    // Clean up uploaded file if transaction fails
    if (req.files?.thumbnail?.[0]?.filename) {
      await deleteFile(req.files.thumbnail[0].filename);
    }
    throw new ApiError(500, "Failed to update course thumbnail");
  }
});

export const coursePublishToggle = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const course = await findCourseBySlug(slug);

  const updatedCourse = await prisma.course.update({
    where: { slug },
    data: { isPublished: !course.isPublished },
  });

  return res
    .status(200)
    .json(
      new ApiResponsive(
        `Course ${updatedCourse.isPublished ? "published" : "unpublished"
        } successfully`,
        { isPublished: updatedCourse.isPublished },
        200
      )
    );
});

export const searchCourses = asyncHandler(async (req, res) => {
  const { query } = req.query;

  if (!query) {
    throw new ApiError(400, "Please provide a search query");
  }

  const courses = await prisma.course.findMany({
    where: {
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
      ],
    },
  });

  return res
    .status(200)
    .json(new ApiResponsive(200, "Courses retrieved successfully", courses));
});

export const getNewCourses = asyncHandler(async (req, res) => {
  const courses = await prisma.course.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "asc" },
    take: 8,
  });

  return res
    .status(200)
    .json(
      new ApiResponsive(200, "New courses retrieved successfully", courses)
    );
});

export const DraftCourse = asyncHandler(async (req, res) => {
  const courses = await prisma.course.findMany({
    where: { isPublished: false },
  });

  return res.status(200).json(
    new ApiResponsive(200, "Draft Courses retrieved successfully", {
      courses,
    })
  );
});

export const coursePage = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const course = await prisma.course.findUnique({
    where: { slug },
    select: {
      id: true,
      title: true,
      description: true,
      thumbnail: true,
      price: true,
      salePrice: true,
      paid: true,
      language: true,
      videoUrl: true,
      isBestseller: true,
      isTrending: true,
      isPopular: true,
      isFeatured: true,
      metaDesc: true,
      metaTitle: true,
      subheading: true,
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      sections: {
        where: { isPublished: true },
        orderBy: { position: "asc" },
        select: {
          id: true,
          title: true,
          chapters: {
            where: { isPublished: true },
            orderBy: { position: "asc" },
            select: {
              id: true,
              title: true,
              isFree: true,
              description: true,
              videoUrl: false,
            },
          },
        },
      },
    },
  });

  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  return res
    .status(200)
    .json(new ApiResponsive(200, course, "Course retrieved successfully"));
});

export const getFreeChapterVideo = asyncHandler(async (req, res) => {
  const { courseSlug, chapterId } = req.params;

  // Find course and specific chapter
  const course = await prisma.course.findFirst({
    where: {
      slug: courseSlug,
      isPublished: true
    },
    include: {
      sections: {
        where: {
          isPublished: true
        },
        include: {
          chapters: {
            where: {
              id: chapterId,
              isPublished: true
            }
          }
        }
      }
    }
  });

  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  // Find the chapter across all sections
  const chapter = course.sections
    .flatMap(section => section.chapters)
    .find(chapter => chapter?.id === chapterId);

  if (!chapter) {
    throw new ApiError(404, "Chapter not found");
  }

  // Check if chapter is free
  if (!chapter.isFree) {
    throw new ApiError(403, "This is a premium chapter");
  }

  return res.status(200).json(
    new ApiResponsive(
      200,
      { videoUrl: chapter.videoUrl },
      "Chapter video URL retrieved successfully"
    )
  );
});

export const updateCourse = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const {
    title,
    description,
    price,
    salePrice,
    language,
    subheading,
    metaTitle,
    metaDesc,
    videoUrl,
    paid,
    isPublished,
    isFeatured,
    isPopular,
    isTrending,
    isBestseller,
    categoryId
  } = req.body;

  // Verify course exists
  const checkCourse = await prisma.course.findUnique({
    where: { slug },
    include: { category: true }
  });

  if (!checkCourse) {
    throw new ApiError(404, "Course not found");
  }

  // Build update data
  const updateData = {};

  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (language !== undefined) updateData.language = language;
  if (subheading !== undefined) updateData.subheading = subheading.trim();
  if (metaTitle !== undefined) updateData.metaTitle = metaTitle;
  if (metaDesc !== undefined) updateData.metaDesc = metaDesc;
  if (videoUrl !== undefined) updateData.videoUrl = videoUrl;
  if (paid !== undefined) updateData.paid = paid;
  if (isPublished !== undefined) updateData.isPublished = isPublished;
  if (isFeatured !== undefined) updateData.isFeatured = isFeatured;
  if (isPopular !== undefined) updateData.isPopular = isPopular;
  if (isTrending !== undefined) updateData.isTrending = isTrending;
  if (isBestseller !== undefined) updateData.isBestseller = isBestseller;
  if (price !== undefined) updateData.price = price ? parseFloat(price) : 0;
  if (salePrice !== undefined) updateData.salePrice = salePrice ? parseFloat(salePrice) : 0;

  // Handle category update
  if (categoryId !== undefined) {
    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      throw new ApiError(400, "Invalid category");
    }

    updateData.categoryId = categoryId;
  }

  // Update course
  const updatedCourse = await prisma.course.update({
    where: { slug },
    data: updateData,
    include: {
      category: true
    }
  });

  return res
    .status(200)
    .json(new ApiResponsive(200, updatedCourse, "Course updated successfully"));
});

export const toggleCourseProperty = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const { property } = req.body;

  const validProperties = [
    "isPublished",
    "paid",
    "isFeatured",
    "isPopular",
    "isTrending",
    "isBestseller",
  ];

  if (!validProperties.includes(property)) {
    throw new ApiError(400, "Invalid property");
  }

  const course = await prisma.course.findUnique({
    where: { slug },
  });

  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  const updatedCourse = await prisma.course.update({
    where: { slug },
    data: {
      [property]: !course[property],
    },
  });

  return res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        { [property]: updatedCourse[property] },
        `Course ${property} updated successfully`
      )
    );
});

export const getAllCourseForSEO = asyncHandler(async (req, res) => {
  const courses = await prisma.course.findMany({
    where: {
      isPublished: true,
    },
    select: {
      title: true,
      description: true,
      slug: true,
      thumbnail: true,
      metaTitle: true,
      metaDesc: true,
      createdAt: true,
      updatedAt: true,
      isPublished: true,
    },
  });

  return res
    .status(200)
    .json(new ApiResponsive(200, courses, "Courses retrieved successfully"));
});

export const getFeaturedSections = asyncHandler(async (req, res) => {
  try {
    const [featured, popular, trending, bestseller, free] = await Promise.all([
      // Featured Courses
      prisma.course.findMany({
        where: {
          isPublished: true,
          isFeatured: true
        },
        take: 4,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnail: true,
          paid: true,
          description: true,
          isFeatured: true,
          price: true,
          salePrice: true,
          language: true,
          category: {
            select: {
              name: true
            }
          }
        }
      }),

      // Popular Courses
      prisma.course.findMany({
        where: {
          isPublished: true,
          isPopular: true
        },
        take: 4,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          slug: true,
          paid: true,
          thumbnail: true,
          description: true,
          isPopular: true,
          price: true,
          salePrice: true,
          language: true,
          category: {
            select: {
              name: true
            }
          }
        }
      }),

      // Trending Courses
      prisma.course.findMany({
        where: {
          isPublished: true,
          isTrending: true
        },
        take: 4,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          paid: true,
          slug: true,
          thumbnail: true,
          description: true,
          isTrending: true,
          price: true,
          salePrice: true,
          language: true,
          category: {
            select: {
              name: true
            }
          }
        }
      }),

      // Bestseller Courses
      prisma.course.findMany({
        where: {
          isPublished: true,
          isBestseller: true
        },
        take: 4,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          slug: true,
          paid: true,
          description: true,
          thumbnail: true,
          isBestseller: true,
          price: true,
          salePrice: true,
          language: true,
          category: {
            select: {
              name: true
            }
          }
        }
      }),
      // Free Courses
      prisma.course.findMany({
        where: {
          isPublished: true,
          paid: false
        },
        take: 4,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          slug: true,
          paid: true,
          thumbnail: true,
          description: true,
          price: true,
          salePrice: true,
          language: true,
          category: {
            select: {
              name: true
            }
          }
        }
      })
    ]);

    return res.status(200).json(
      new ApiResponsive(200, {
        featured: featured.length > 0 ? featured : null,
        popular: popular.length > 0 ? popular : null,
        trending: trending.length > 0 ? trending : null,
        bestseller: bestseller.length > 0 ? bestseller : null,
        free: free.length > 0 ? free : null
      })
    );
  } catch (error) {
    console.error("Featured sections error:", error);
    throw new ApiError(500, "Failed to fetch featured sections");
  }
});