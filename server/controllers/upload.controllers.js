import { PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import s3client from "../utils/s3client.js";
import { getFileUrl } from "../utils/deleteFromS3.js";

// Upload zoom session thumbnail
export const uploadZoomThumbnail = asyncHandler(async (req, res) => {
    try {
        if (!req.file) {
            throw new ApiError(400, "No file uploaded");
        }

        const file = req.file;
        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

        if (!allowedTypes.includes(file.mimetype)) {
            throw new ApiError(400, "Only JPEG, PNG, WebP files are allowed");
        }

        const maxSize = 2 * 1024 * 1024; // 2MB
        if (file.size > maxSize) {
            throw new ApiError(400, "File size too large. Maximum allowed size is 2MB");
        }

        // Generate unique identifier for the file
        const fileId = uuidv4();
        const fileExtension = path.extname(file.originalname);

        // Use the UPLOAD_FOLDER environment variable for the base path
        const uploadFolder = process.env.UPLOAD_FOLDER || "bansuri";
        const fileName = `${uploadFolder}/zoom-thumbnails/${fileId}${fileExtension}`;

        // Upload to S3/DigitalOcean Spaces
        const uploadParams = {
            Bucket: process.env.SPACES_BUCKET,
            Key: fileName,
            Body: file.buffer,
            ContentType: file.mimetype,
            ACL: "public-read",
        };

        await s3client.send(new PutObjectCommand(uploadParams));

        // Generate the URL for the uploaded file
        const fileUrl = getFileUrl(fileName);

        return res.status(200).json(
            new ApiResponsive(200, { url: fileUrl }, "File uploaded successfully")
        );
    } catch (error) {
        console.error("Error uploading file:", error);
        throw new ApiError(error.statusCode || 500, error.message || "Failed to upload file");
    }
});
