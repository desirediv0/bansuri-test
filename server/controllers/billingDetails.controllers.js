import { prisma } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";

export const createBillingDetails = asyncHandler(async (req, res) => {
  const {
    fullName,
    email,
    address,
    city,
    state,
    country,
    zipCode,
    courseIds,
    saveAddress,
  } = req.body;

  const userId = req.user.id;

  if (!courseIds || !courseIds.length) {
    throw new ApiError(400, "At least one course ID is required");
  }

  // Create billing details with courses
  const billingDetails = await prisma.billingDetails.create({
    data: {
      fullName,
      email,
      address,
      city,
      state,
      country,
      zipCode,
      saveAddress: Boolean(saveAddress),
      user: {
        connect: { id: userId },
      },
      courses: {
        create: courseIds.map((courseId) => ({
          course: {
            connect: { id: courseId },
          },
        })),
      },
    },
    include: {
      courses: {
        include: {
          course: true,
        },
      },
    },
  });

  res
    .status(201)
    .json(
      new ApiResponsive(
        201,
        billingDetails,
        "Billing details created successfully"
      )
    );
});

// Get saved addresses by user ID
export const getSavedAddressesByUser = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const addresses = await prisma.billingDetails.findMany({
    where: {
      userId,
      saveAddress: true,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      address: true,
      city: true,
      state: true,
      country: true,
      zipCode: true,
    },
    distinct: ["address", "city", "state", "country", "zipCode"],
    orderBy: {
      createdAt: "desc",
    },
  });

  res
    .status(200)
    .json(
      new ApiResponsive(200, addresses, "Saved addresses fetched successfully")
    );
});
// Get billing details by user ID
export const getBillingDetailsByUser = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const billingDetails = await prisma.billingDetails.findMany({
    where: { userId },
  });

  res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        billingDetails,
        "Billing details fetched successfully"
      )
    );
});

// Update billing details
export const updateBillingDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    fullName,
    email,
    address,
    city,
    state,
    country,
    zipCode,
    paymentStatus,
  } = req.body;

  const billingDetails = await prisma.billingDetails.update({
    where: { id },
    data: {
      fullName,
      email,
      address,
      city,
      state,
      country,
      zipCode,
      paymentStatus,
    },
  });

  res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        billingDetails,
        "Billing details updated successfully"
      )
    );
});

// Delete billing details
export const deleteBillingDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await prisma.billingDetails.delete({
    where: { id },
  });

  res
    .status(200)
    .json(new ApiResponsive(200, null, "Billing details deleted successfully"));
});

export const paymentStatusToggle = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { paymentStatus } = req.body;

  const billingDetails = await prisma.billingDetails.update({
    where: { id },
    data: {
      paymentStatus,
    },
  });

  res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        billingDetails,
        "Payment status updated successfully"
      )
    );
});

export const admingetAllBillingDetails = asyncHandler(async (req, res) => {
  const billingDetails = await prisma.billingDetails.findMany();

  res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        billingDetails,
        "All billing details fetched successfully"
      )
    );
});
