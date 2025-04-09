import { Router } from "express";
import {
  createChapter,
  getChapters,
  getChapter,
  updateChapter,
  deleteChapter,
  chapterPublishToggle,
  chapterFreeToggle,
  chapterProgress,
  getDraftChapters,
  getChapterVideoUrl,
  reorderChapters,
  getAllChapterBySectionSlug,
} from "../controllers/chapter.controllers.js";

import { verifyJWTToken } from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/admin.middleware.js";
import { uploadFiles, processFiles } from "../middlewares/multer.middlerware.js";

const router = Router();

// Configure multer for file uploads - for routes that need file uploads
const fileUploadConfig = uploadFiles.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'pdf', maxCount: 1 },
  { name: 'audio', maxCount: 1 }
]);

router.route("/url/:slug").post(getChapterVideoUrl);

router.route("/").get(verifyJWTToken, getChapters);

router
  .route("/:slug")
  .get(verifyJWTToken, getChapter)
  .put(verifyJWTToken, verifyAdmin, fileUploadConfig, processFiles, updateChapter)
  .delete(verifyJWTToken, verifyAdmin, deleteChapter);

router
  .route("/:slug/publish")
  .patch(verifyJWTToken, verifyAdmin, chapterPublishToggle);

router
  .route("/:slug/free")
  .patch(verifyJWTToken, verifyAdmin, chapterFreeToggle);

router.route("/progress").post(verifyJWTToken, chapterProgress);
router
  .route("/draft-chapter")
  .get(verifyJWTToken, verifyAdmin, getDraftChapters);

router
  .route("/create/:sectionSlug")
  .post(verifyJWTToken, verifyAdmin, fileUploadConfig, processFiles, createChapter);

router.route("/get/:sectionSlug").get(verifyJWTToken, getChapters);
router
  .route("/reorder/:sectionSlug")
  .put(verifyJWTToken, verifyAdmin, reorderChapters);

router
  .route("/get-all-chapter-by-section-slug/:sectionSlug")
  .get(verifyJWTToken, getAllChapterBySectionSlug);

export default router;
