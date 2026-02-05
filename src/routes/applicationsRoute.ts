import { Router } from "express";
import {
  createApplication,
  getAllApplications,
  getApplication,
  updateApplication,
  deleteApplication,
  updateStatus,
} from "../controllers/applicationController";

import { authenticate } from "../middleware/auth";

const router = Router();

// All routes are protected
router.use(authenticate);

router.post("/", createApplication);
router.get("/", getAllApplications);

router.get("/:id", getApplication);
router.put("/:id", updateApplication);
router.delete("/:id", deleteApplication);

// Special route for quick status change
router.patch("/:id/status", updateStatus);

export default router;
