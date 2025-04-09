import { prisma } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";

// Add course to cart
export const addToCart = asyncHandler(async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.user.id;

    // Check if the course is already in the cart
    const existingCartItem = await prisma.cart.findFirst({
      where: {
        userId,
        courseId,
      },
    });

    if (existingCartItem) {
      return res
        .status(400)
        .json(new ApiError(400, "Course is already in the cart"));
    }

    const cartItem = await prisma.cart.create({
      data: {
        userId,
        courseId,
      },
    });

    res
      .status(201)
      .json(
        new ApiResponsive(201, cartItem, "Course added to cart successfully")
      );
  } catch (error) {
    throw new ApiError(500, "Error adding course to cart", [error.message]);
  }
});

// Get cart items by user ID
export const getCartItemsByUser = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;

    const cartItems = await prisma.cart.findMany({
      where: { userId },
      include: {
        course: true,
      },
    });

    res
      .status(200)
      .json(
        new ApiResponsive(200, cartItems, "Cart items fetched successfully")
      );
  } catch (error) {
    throw new ApiError(500, "Error fetching cart items", [error.message]);
  }
});

// Remove course from cart
export const removeFromCart = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.cart.delete({
      where: { id },
    });

    res
      .status(200)
      .json(
        new ApiResponsive(200, null, "Course removed from cart successfully")
      );
  } catch (error) {
    throw new ApiError(500, "Error removing course from cart", [error.message]);
  }
});

export const addToCartByCourseSlug = asyncHandler(async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.user.id;

    const course = await prisma.course.findFirst({
      where: { slug },
      select: {
        id: true,
        paid: true,
        price: true,
      },
    });

    if (!course) {
      return res.status(404).json(new ApiError(404, "Course not found"));
    }

    // Only add to cart if course is paid
    if (!course.paid) {
      return res
        .status(400)
        .json(new ApiError(400, "Free courses cannot be added to cart"));
    }

    // Check if already in cart
    const existingCartItem = await prisma.cart.findFirst({
      where: {
        userId,
        courseId: course.id,
      },
    });

    if (existingCartItem) {
      return res.status(400).json(new ApiError(400, "Course already in cart"));
    }

    const cartItem = await prisma.cart.create({
      data: {
        userId,
        courseId: course.id,
      },
    });

    res
      .status(201)
      .json(new ApiResponsive(201, cartItem, "Course added to cart"));
  } catch (error) {
    throw new ApiError(500, "Error adding to cart", [error.message]);
  }
});
