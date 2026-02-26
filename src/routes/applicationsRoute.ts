import { Router } from "express";
import {
  createApplication,
  getAllApplications,
  getApplication,
  updateApplication,
  deleteApplication,
  updateStatus,
  getStats,
} from "../controllers/applicationController";

import { authenticate } from "../middleware/auth";

const router = Router();

// All routes are protected
router.use(authenticate);

router.post("/", createApplication);
router.get("/", getAllApplications);

// Special routes must come before /:id to avoid conflicts
router.get("/stats", getStats);
router.patch("/:id/status", updateStatus);

router.get("/:id", getApplication);
router.put("/:id", updateApplication);
router.delete("/:id", deleteApplication);

export default router;
