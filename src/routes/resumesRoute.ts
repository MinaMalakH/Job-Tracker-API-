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

/**
 * @openapi
 * /api/resumes:
 *   post:
 *     tags:
 *       - Resumes
 *     summary: Upload a new resume
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - resume
 *             properties:
 *               resume:
 *                 type: string
 *                 format: binary
 *               title:
 *                 type: string
 *     responses:
 *       '201':
 *         description: Resume uploaded successfully
 *       '400':
 *         description: Invalid file format
 */
router.post("/", uploadMiddleware.single("resume"), uploadResume);

/**
 * @openapi
 * /api/resumes:
 *   get:
 *     tags:
 *       - Resumes
 *     summary: Get all user resumes
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: List of resumes
 *       '401':
 *         description: Unauthorized
 */
router.get("/", getAllResumes);

/**
 * @openapi
 * /api/resumes/{id}:
 *   get:
 *     tags:
 *       - Resumes
 *     summary: Get a specific resume
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Resume details
 *       '404':
 *         description: Resume not found
 */
router.get("/:id", getResume);

export default router;
