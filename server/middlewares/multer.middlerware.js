// utils/fileHandlers.js
import multer from 'multer';
import sharp from 'sharp';
import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import s3client from '../utils/s3client.js';


// Set up multer storage
const storage = multer.memoryStorage();
export const uploadFiles = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit for PDFs and audio
});

// Function to process and upload image
export const processAndUploadImage = async (file) => {
  const { originalname, buffer } = file;
  const filename = `${process.env.UPLOAD_FOLDER}/images/${Date.now()}-${originalname.toLowerCase().split(' ').join('-')}`;

  try {
    const processedBuffer = await sharp(buffer)
      .resize(800)
      .jpeg({ quality: 80 })
      .toBuffer();

    await s3client.send(
      new PutObjectCommand({
        Bucket: process.env.SPACES_BUCKET,
        Key: filename,
        Body: processedBuffer,
        ACL: 'public-read',
        ContentType: 'image/jpeg'
      })
    );

    return filename;
  } catch (error) {
    console.error('Image processing/upload failed:', error);
    throw error;
  }
};

// Function to upload PDF
export const uploadPDF = async (file) => {
  const { originalname, buffer, mimetype } = file;
  const filename = `${process.env.UPLOAD_FOLDER}/pdfs/${Date.now()}-${originalname.toLowerCase().split(' ').join('-')}`;

  try {
    await s3client.send(
      new PutObjectCommand({
        Bucket: process.env.SPACES_BUCKET,
        Key: filename,
        Body: buffer,
        ACL: 'public-read',
        ContentType: mimetype || 'application/pdf'
      })
    );

    return filename;
  } catch (error) {
    console.error('PDF upload failed:', error);
    throw error;
  }
};

// Function to upload Audio
export const uploadAudio = async (file) => {
  const { originalname, buffer, mimetype } = file;
  const filename = `${process.env.UPLOAD_FOLDER}/audio/${Date.now()}-${originalname.toLowerCase().split(' ').join('-')}`;

  try {
    await s3client.send(
      new PutObjectCommand({
        Bucket: process.env.SPACES_BUCKET,
        Key: filename,
        Body: buffer,
        ACL: 'public-read',
        ContentType: mimetype || 'audio/mpeg'
      })
    );

    return filename;
  } catch (error) {
    console.error('Audio upload failed:', error);
    throw error;
  }
};

// Middleware to handle file processing
export const processFiles = async (req, res, next) => {
  try {
    // Process thumbnail/image if exists
    if (req.files?.thumbnail) {
      const filename = await processAndUploadImage(req.files.thumbnail[0]);
      req.files.thumbnail[0].filename = filename;
    }

    // Process PDF if exists
    if (req.files?.pdf) {
      const filename = await uploadPDF(req.files.pdf[0]);
      req.files.pdf[0].filename = filename;
    }

    // Process audio if exists
    if (req.files?.audio) {
      const filename = await uploadAudio(req.files.audio[0]);
      req.files.audio[0].filename = filename;
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Get file URL from filename
export const getFileUrl = (filename) => {
  if (!filename) return null;
  return `https://${process.env.SPACES_BUCKET}.${process.env.SPACES_REGION}.digitaloceanspaces.com/${filename}`;
};

// Delete file from S3/DigitalOcean Spaces
export const deleteFile = async (fileUrl) => {
  try {
    if (!fileUrl) return;

    let Key;

    // Check if fileUrl is a full URL
    if (fileUrl.startsWith('http')) {
      const parsedUrl = new URL(fileUrl);
      Key = parsedUrl.pathname.slice(1);
    } else {
      Key = fileUrl.startsWith('/') ? fileUrl.slice(1) : fileUrl;
    }

    await s3client.send(
      new DeleteObjectCommand({
        Bucket: process.env.SPACES_BUCKET,
        Key,
      })
    );

    console.log(`File deleted: ${Key}`);
  } catch (error) {
    console.error('File deletion error:', error);
    throw error;
  }
};