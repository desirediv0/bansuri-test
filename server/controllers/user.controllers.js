import { prisma } from "../config/db.js";
import { validatePassword } from "../helper/validatePassword.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateAccessAndRefreshTokens } from "../helper/generateAccessAndRefreshTokens.js";
import jwt from "jsonwebtoken";
import { createSlug } from "../helper/Slug.js";
import axios from "axios";
import { SendEmail } from "../email/SendEmail.js";
import xlsx from "xlsx";

const SALT_ROUNDS = 12;
const TOKEN_EXPIRY = 2 * 60 * 60 * 1000; // 2 hours
const COOKIE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ApiError(400, "Please provide a valid email address");
  }
};

const findUserByEmail = async (email, provider = "credentials") => {
  return await prisma.user.findUnique({
    where: { email, provider },
  });
};

const createUser = async (userData) => {
  const user = await prisma.user.create({ data: userData });
  if (!user) {
    throw new ApiError(500, "Failed to create user");
  }
  return user;
};

const updateUser = async (id, data) => {
  return await prisma.user.update({ where: { id }, data });
};

const sendVerificationEmail = async (user, token) => {
  const verificationLink = `${process.env.BASE_URL}/verify-email?token=${token}&id=${user.id}`;
  await SendEmail({
    email: user.email,
    emailType: "VERIFY",
    message: verificationLink,
  });
};

const sendResetPasswordEmail = async (user, token) => {
  const resetPasswordLink = `${process.env.BASE_URL}/reset-password?token=${token}&id=${user.id}`;
  await SendEmail({
    email: user.email,
    emailType: "RESET",
    message: resetPasswordLink,
  });
};

const generateToken = () => crypto.randomBytes(32).toString("hex");

export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, provider, slug, usertype } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(
      400,
      "Please provide all required fields: name, email, and password"
    );
  }

  validateEmail(email);
  validatePassword(password);

  const existingUser = await findUserByEmail(email, provider);
  if (existingUser) {
    throw new ApiError(409, "User with this email or provider already exists");
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const verificationToken = generateToken();

  let uniqueSlug = slug ? createSlug(slug) : createSlug(name);
  let existingSlug = await prisma.user.findUnique({
    where: { slug: uniqueSlug },
  });
  let counter = 1;

  while (existingSlug) {
    uniqueSlug = `${createSlug(slug || name)}-${counter}`;
    existingSlug = await prisma.user.findUnique({
      where: { slug: uniqueSlug },
    });
    counter++;
  }

  const newUser = await createUser({
    name,
    email,
    password: hashedPassword,
    role,
    provider,
    usertype,
    slug: uniqueSlug,
    verificationToken,
    verificationTokenExpiry: new Date(Date.now() + TOKEN_EXPIRY),
  });

  await sendVerificationEmail(newUser, verificationToken);

  return res.status(201).json(
    new ApiResponsive(
      201,
      {
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      },
      "User registered successfully. Please check your email to verify your account."
    )
  );
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const { token, id } = req.body;

  if (!token || !id) {
    throw new ApiError(400, "Invalid token or ID");
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      isVerified: true,
      verificationToken: true,
      verificationTokenExpiry: true,
      name: true,
      email: true,
      role: true,
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Check if already verified
  if (user.isVerified) {
    throw new ApiError(400, "Email already verified");
  }

  if (
    user.verificationToken !== token ||
    user.verificationTokenExpiry < new Date()
  ) {
    throw new ApiError(400, "Invalid or expired token");
  }

  const updatedUser = await updateUser(user.id, {
    isVerified: true,
    verificationToken: null,
    verificationTokenExpiry: null,
  });

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    updatedUser.id,
    { name: updatedUser.name, email: updatedUser.email, role: updatedUser.role }
  );

  const cookieOptions = {
    secure: true,
    sameSite: "Strict",
    domain: "bansurividyamandir.com",
    path: "/",
    expires: new Date(Date.now() + COOKIE_EXPIRY),
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponsive(
        200,
        {
          user: {
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            isVerified: updatedUser.isVerified,
          },
          accessToken,
        },
        "Email verified and user logged in successfully"
      )
    );
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password, provider = "credentials" } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Please provide email and password");
  }

  const user = await findUserByEmail(email, provider);
  if (!user) {
    throw new ApiError(401, "Invalid credentials or password");
  }

  if (!user.isVerified) {
    throw new ApiError(403, "Email not verified");
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid credentials or password");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user.id,
    { name: user.name, email: user.email, role: user.role }
  );

  const cookieOptions = {
    secure: true,
    sameSite: "Strict",
    domain: "bansurividyamandir.com",
    path: "/",
    expires: new Date(Date.now() + COOKIE_EXPIRY),
  };

  res.cookie("refreshToken", refreshToken, cookieOptions);
  res.cookie("accessToken", accessToken, cookieOptions);

  return res
    .status(200)
    .json(
      new ApiResponsive(200, { accessToken }, "User logged in successfully")
    );
});

export const reSendVerificationEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Please provide email");
  }

  const user = await findUserByEmail(email);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.isVerified) {
    throw new ApiError(400, "Email already verified");
  }

  const verificationToken = generateToken();
  const updatedUser = await updateUser(user.id, {
    verificationToken,
    verificationTokenExpiry: new Date(Date.now() + TOKEN_EXPIRY),
  });

  await sendVerificationEmail(updatedUser, verificationToken);

  return res.status(200).json(
    new ApiResponsive(
      200,
      {
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
        },
      },
      "Verification email sent successfully"
    )
  );
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Please provide email");
  }

  const user = await findUserByEmail(email);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const resetPasswordToken = generateToken();
  const updatedUser = await updateUser(user.id, {
    resetToken: resetPasswordToken,
    resetTokenExpiry: new Date(Date.now() + TOKEN_EXPIRY),
  });

  await sendResetPasswordEmail(updatedUser, resetPasswordToken);

  return res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        { user: { id: updatedUser.id } },
        "Reset password email sent successfully"
      )
    );
});

export const logoutUser = asyncHandler(async (req, res) => {
  const cookieOptions = {
    domain: "bansurividyamandir.com",
    path: "/",
    secure: true,
    sameSite: "Strict",
  };

  // Clear cookies for 'bansurividyamandir.com'
  res.clearCookie("accessToken", cookieOptions);
  res.clearCookie("refreshToken", cookieOptions);

  // Clear cookies for 'bansurividyamandir.com'
  const subdomainOptions = {
    domain: "bansurividyamandir.com",
    path: "/",
    secure: true,
    sameSite: "Strict",
  };

  res.clearCookie("accessToken", subdomainOptions);
  res.clearCookie("refreshToken", subdomainOptions);

  return res.status(200).json({ message: "User logged out successfully" });
});

export const updateName = asyncHandler(async (req, res) => {
  const { name } = req.body;

  if (!name) {
    throw new ApiError(400, "Please provide name");
  }

  const updatedUser = await updateUser(req.user.id, { name });

  return res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        { user: { id: updatedUser.id, name: updatedUser.name } },
        "Name updated successfully"
      )
    );
});

export const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new ApiError(400, "Please provide current password and new password");
  }

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  const isPasswordCorrect = await bcrypt.compare(
    currentPassword,
    user.password
  );
  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid current password");
  }

  validatePassword(newPassword);
  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

  const updatedUser = await updateUser(req.user.id, {
    password: hashedPassword,
  });

  return res.status(200).json(
    new ApiResponsive(
      200,
      {
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
        },
      },
      "Password updated successfully"
    )
  );
});

export const refreshToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(400, "No refresh token provided");
  }

  const decodedToken = jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET
  );

  const user = await prisma.user.findUnique({ where: { id: decodedToken.id } });
  if (!user) {
    throw new ApiError(401, "Invalid refresh token");
  }
  if (incomingRefreshToken !== user.refreshToken) {
    throw new ApiError(401, "Refresh token is expired or invalid");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user.id
  );

  const cookieOptions = {
    secure: true,
    sameSite: "Strict",
    domain: "bansurividyamandir.com",
    path: "/",
    expires: new Date(Date.now() + COOKIE_EXPIRY),
  };

  res.cookie("refreshToken", refreshToken, cookieOptions);
  res.cookie("accessToken", accessToken, cookieOptions);

  return res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        { accessToken, refreshToken },
        "Access token refreshed successfully"
      )
    );
});

export const deleteUser = asyncHandler(async (req, res) => {
  try {
    const user = await prisma.user.delete({ where: { id: req.user.id } });
    if (!user) {
      throw new ApiError(404, "User not found or already deleted");
    }

    return res
      .status(200)
      .json(new ApiResponsive(200, {}, "User deleted successfully"));
  } catch (error) {
    if (error.code === "P2025") {
      throw new ApiError(404, "User not found");
    }
    throw new ApiError(400, "Failed to delete user", error);
  }
});

export const GetLoggedInUser = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, name: true, email: true, role: true, isVerified: true },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponsive(200, { user }, "User details fetched successfully")
    );
});

export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      usertype: true,
      isVerified: true,
      provider: true,
      slug: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!users || users.length === 0) {
    throw new ApiError(404, "No users found");
  }

  const totalUsers = await prisma.user.count();

  return res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        { users, totalUsers },
        "Users fetched successfully"
      )
    );
});

export const checkUserLoggedIn = asyncHandler(async (req, res) => {
  if (req.user) {
    return res
      .status(200)
      .json(new ApiResponsive(200, { user: req.user }, "User is logged in"));
  } else {
    return res
      .status(401)
      .json(new ApiResponsive(401, null, "User is not logged in"));
  }
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, id, password } = req.body;

  if (!token || !id || !password) {
    throw new ApiError(400, "Please provide token, id, and password");
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.resetToken !== token || user.resetTokenExpiry < new Date()) {
    throw new ApiError(400, "Invalid or expired token");
  }

  validatePassword(password);
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const updatedUser = await updateUser(user.id, {
    password: hashedPassword,
    resetToken: null,
    resetTokenExpiry: null,
  });

  return res.status(200).json(
    new ApiResponsive(
      200,
      {
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
        },
      },
      "Password reset successfully"
    )
  );
});

export const checkAuth = asyncHandler(async (req, res) => {
  try {
    const user = req.user;

    return res
      .status(200)
      .json(new ApiResponsive(200, { user }, "Authenticated user!"));
  } catch (error) {
    throw new ApiError(400, "Failed to authenticate user", error);
  }
});

export const getUserBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  if (!slug) {
    throw new ApiError(400, "Please provide slug");
  }

  const user = await prisma.user.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isVerified: true,
      usertype: true,
      slug: true,
      Purchase: {
        select: {
          course: {
            select: {
              id: true,
              title: true,
              description: true,
              price: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponsive(200, { user }, "User details fetched successfully")
    );
});
export const googleAuth = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    throw new ApiError(400, "Token is required");
  }

  try {
    const userInfoResponse = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const { email, name } = userInfoResponse.data;

    // Check if user exists with email
    let user = await prisma.user.findFirst({
      where: { email },
    });

    // If user exists with credentials, throw error
    if (user && user.provider === "credentials") {
      throw new ApiError(
        400,
        `This email is already registered with us. Please use your password to login or use different email for Google login.`
      );
    }

    // If no user exists or user exists with google provider
    if (!user) {
      let uniqueSlug = createSlug(name);
      let existingSlug = await prisma.user.findUnique({
        where: { slug: uniqueSlug },
      });
      let counter = 1;

      while (existingSlug) {
        uniqueSlug = `${createSlug(name)}-${counter}`;
        existingSlug = await prisma.user.findUnique({
          where: { slug: uniqueSlug },
        });
        counter++;
      }

      user = await prisma.user.create({
        data: {
          name,
          email,
          provider: "google",
          isVerified: true,
          slug: uniqueSlug,
          password: "",
        },
      });
    }

    // Generate tokens and continue...
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user.id,
      { name: user.name, email: user.email, role: user.role }
    );

    const cookieOptions = {
      secure: true,
      sameSite: "Strict",
      domain: "bansurividyamandir.com",
      path: "/",
      expires: new Date(Date.now() + COOKIE_EXPIRY),
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", refreshToken, cookieOptions)
      .json(
        new ApiResponsive(
          200,
          {
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
            },
            accessToken,
          },
          "Google authentication successful"
        )
      );
  } catch (error) {
    console.error("Google Auth Error:", error);
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Authentication failed"
    );
  }
});

export const AdminGetUserBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  if (!slug) {
    throw new ApiError(400, "Please provide slug");
  }

  const user = await prisma.user.findUnique({
    where: { slug },
    select: {
      id: true,
      password: false,
      name: true,
      email: true,
      role: true,
      isVerified: true,
      slug: true,
      usertype: true,
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponsive(200, { user }, "User details fetched successfully")
    );
});

const createUniqueSlug = async (name, counter = 0) => {
  const baseSlug = createSlug(name);
  const slug = counter === 0 ? baseSlug : `${baseSlug}-${counter}`;

  const existingUser = await prisma.user.findUnique({
    where: { slug },
  });

  if (existingUser) {
    return createUniqueSlug(name, counter + 1);
  }

  return slug;
};

export const AdminUpdateUser = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const updateData = req.body;

  if (!slug) {
    throw new ApiError(400, "Please provide user slug");
  }

  // Only update provided fields
  const cleanedUpdateData = Object.keys(updateData).reduce((acc, key) => {
    if (updateData[key] !== undefined) {
      acc[key] = updateData[key];
    }
    return acc;
  }, {});

  if (cleanedUpdateData.name) {
    cleanedUpdateData.slug = await createUniqueSlug(cleanedUpdateData.name);
  }

  if (cleanedUpdateData.email) {
    validateEmail(cleanedUpdateData.email);
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanedUpdateData.email },
    });
    if (existingUser) {
      throw new ApiError(409, "User with this email already exists");
    }
  }

  // If verifying user, clear tokens
  if (cleanedUpdateData.isVerified === true) {
    cleanedUpdateData.verificationToken = null;
    cleanedUpdateData.verificationTokenExpiry = null;
  }

  if (cleanedUpdateData.password) {
    const hashedPassword = await bcrypt.hash(
      cleanedUpdateData.password,
      SALT_ROUNDS
    );
    cleanedUpdateData.password = hashedPassword;
  }

  const updatedUser = await prisma.user.update({
    where: { slug },
    data: cleanedUpdateData,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isVerified: true,
      slug: true,
      usertype: true,
    },
  });

  return res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        { user: updatedUser },
        "User details updated successfully"
      )
    );
});

export const AdminDeleteUser = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  if (!slug) {
    throw new ApiError(400, "Please provide user ID");
  }

  // Fetch the user to ensure it exists
  const user = await prisma.user.findUnique({
    where: { slug },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Delete related records
  await prisma.payment.deleteMany({
    where: { userId: user.id },
  });

  await prisma.billingDetails.deleteMany({
    where: { userId: user.id },
  });

  await prisma.cart.deleteMany({
    where: { userId: user.id },
  });

  await prisma.review.deleteMany({
    where: { userId: user.id },
  });

  // Delete related fee payments
  await prisma.feePayment.deleteMany({
    where: { userId: user.id },
  });

  // Delete related fees
  await prisma.fee.deleteMany({
    where: { userId: user.id },
  });

  // Finally, delete the user
  await prisma.user.delete({
    where: { slug },
  });

  return res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        null,
        "User and all associated data deleted successfully"
      )
    );
});

export const ImportDataFromExcel = asyncHandler(async (req, res) => {
  try {
    if (!req.file) {
      throw new ApiError(400, "Please upload an Excel file");
    }

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = xlsx.utils.sheet_to_json(worksheet);

    const results = {
      successful: 0,
      failed: 0,
      errors: [],
    };

    for (const row of jsonData) {
      try {
        // Validate required fields
        if (!row.name || !row.email || !row.password) {
          results.errors.push(
            `Row with email ${row.email || "unknown"}: Missing required fields`
          );
          results.failed++;
          continue;
        }

        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
          where: { email: row.email },
        });

        if (existingUser) {
          results.errors.push(`User with email ${row.email} already exists`);
          results.failed++;
          continue;
        }

        // Create unique slug
        let uniqueSlug = createSlug(row.name);
        let existingSlug = await prisma.user.findUnique({
          where: { slug: uniqueSlug },
        });
        let counter = 1;

        while (existingSlug) {
          uniqueSlug = `${createSlug(row.name)}-${counter}`;
          existingSlug = await prisma.user.findUnique({
            where: { slug: uniqueSlug },
          });
          counter++;
        }

        // Create user
        await prisma.user.create({
          data: {
            name: row.name,
            email: row.email,
            password: row.password,
            slug: uniqueSlug,
            isVerified: true,
            provider: "credentials",
            role: "STUDENT",
          },
        });

        results.successful++;
      } catch (error) {
        results.errors.push(`Error processing ${row.email}: ${error.message}`);
        results.failed++;
      }
    }

    return res
      .status(200)
      .json(
        new ApiResponsive(
          200,
          { results },
          `Import completed. Successfully imported ${results.successful} users. Failed: ${results.failed}`
        )
      );
  } catch (error) {
    throw new ApiError(500, "Failed to process Excel file: " + error.message);
  }
});
