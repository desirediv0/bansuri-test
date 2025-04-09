import { Router } from "express";
import { verifyJWTToken } from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/admin.middleware.js";
import {
  createSection,
  getSections,
  updateSection,
  deleteSection,
  reorderSections,
  toggleSectionPublish,
  toggleSectionFree,
} from "../controllers/section.controllers.js";

const router = Router();

router.use(verifyJWTToken, verifyAdmin);

router.route("/create/:courseSlug").post(createSection);
router.route("/get/:courseSlug").get(getSections);
router.route("/update/:sectionSlug").put(updateSection);
router.route("/delete/:sectionSlug").delete(deleteSection);
router.route("/reorder/:courseSlug").put(reorderSections);
router.route("/toggle-publish/:sectionSlug").put(toggleSectionPublish);
router.route("/toggle-free/:sectionSlug").put(toggleSectionFree);

export default router;
