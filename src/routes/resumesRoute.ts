import { Router } from "express";
import {
  uploadResume,
  getAllResumes,
  getResume,
} from "../controllers/resumeController";

import { authenticate } from "../middleware/auth";
import { uploadResume as uploadMiddleware } from "../middleware/upload";

const router = Router();

router.use(authenticate);

router.post("/", uploadMiddleware.single("resume"), uploadResume);
router.get("/", getAllResumes);
router.get("/:id", getResume);

export default router;
