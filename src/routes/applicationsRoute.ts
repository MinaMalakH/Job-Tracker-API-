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

/**
 * @openapi
 * /api/applications:
 *   post:
 *     tags:
 *       - Applications
 *     summary: Create a new job application
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - company
 *               - position
 *             properties:
 *               company:
 *                 type: string
 *               position:
 *                 type: string
 *               location:
 *                 type: string
 *               appliedDate:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *                 enum: [applied, interviewing, offered, rejected]
 *     responses:
 *       '201':
 *         description: Application created successfully
 *       '400':
 *         description: Invalid input
 */
router.post("/", createApplication);

/**
 * @openapi
 * /api/applications:
 *   get:
 *     tags:
 *       - Applications
 *     summary: Get all user applications
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: List of applications
 *       '401':
 *         description: Unauthorized
 */
router.get("/", getAllApplications);

/**
 * @openapi
 * /api/applications/stats:
 *   get:
 *     tags:
 *       - Applications
 *     summary: Get application statistics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Application stats (applied, interviewing, offered, rejected counts)
 *       '401':
 *         description: Unauthorized
 */
router.get("/stats", getStats);

/**
 * @openapi
 * /api/applications/{id}/status:
 *   patch:
 *     tags:
 *       - Applications
 *     summary: Update application status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [applied, interviewing, offered, rejected]
 *     responses:
 *       '200':
 *         description: Status updated successfully
 *       '404':
 *         description: Application not found
 */
router.patch("/:id/status", updateStatus);

/**
 * @openapi
 * /api/applications/{id}:
 *   get:
 *     tags:
 *       - Applications
 *     summary: Get single application by ID
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
 *         description: Application details
 *       '404':
 *         description: Application not found
 */
router.get("/:id", getApplication);

/**
 * @openapi
 * /api/applications/{id}:
 *   put:
 *     tags:
 *       - Applications
 *     summary: Update an application
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               company:
 *                 type: string
 *               position:
 *                 type: string
 *               location:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [applied, interviewing, offered, rejected]
 *     responses:
 *       '200':
 *         description: Application updated
 *       '404':
 *         description: Application not found
 */
router.put("/:id", updateApplication);

/**
 * @openapi
 * /api/applications/{id}:
 *   delete:
 *     tags:
 *       - Applications
 *     summary: Delete an application
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
 *         description: Application deleted
 *       '404':
 *         description: Application not found
 */
router.delete("/:id", deleteApplication);

export default router;
