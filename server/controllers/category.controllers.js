import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";


export const getAllCategories = asyncHandler(async (req, res) => {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' }
  });
  return res.status(200).json(
    new ApiResponsive(200, categories, "Categories fetched successfully")
  );
});

export const createCategory = asyncHandler(async (req, res) => {
  const { name } = req.body;

  if (!name || name.trim().length < 2) {
    throw new ApiError(400, "Category name must be at least 2 characters");
  }

  // Normalize name
  const normalizedName = name.trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  // Check for existing category
  const existingCategory = await prisma.category.findFirst({
    where: { name: normalizedName }
  });

  if (existingCategory) {
    throw new ApiError(400, "Category already exists");
  }

  // Create category
  const category = await prisma.category.create({
    data: { name: normalizedName }
  });

  return res.status(201).json(
    new ApiResponsive(201, category, "Category created successfully")
  );
});

export const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name || name.trim().length < 2) {
    throw new ApiError(400, "Category name must be at least 2 characters");
  }

  const normalizedName = name.trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const existingCategory = await prisma.category.findFirst({
    where: {
      name: normalizedName,
      NOT: { id }
    }
  });

  if (existingCategory) {
    throw new ApiError(400, "Category name already exists");
  }

  const category = await prisma.category.update({
    where: { id },
    data: { name: normalizedName }
  });

  return res.status(200).json(
    new ApiResponsive(200, category, "Category updated successfully")
  );
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if category exists
  const category = await prisma.category.findUnique({
    where: { id },
    include: { Courses: true }
  });

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  if (category.Courses.length > 0) {
    throw new ApiError(400, "Cannot delete category with associated courses");
  }

  await prisma.category.delete({ where: { id } });

  return res.status(200).json(
    new ApiResponsive(200, null, "Category deleted successfully")
  );
});