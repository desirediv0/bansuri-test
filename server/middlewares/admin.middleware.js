import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const verifyAdmin = asyncHandler(async (req, res, next) => {
  if (req.user.role !== "ADMIN") {
    throw new ApiError(
      403,
      "Forbidden - You do not have access to this resource"
    );
  }
  next();
});
