import { Router } from "express";
import {
  testAiConnection,
  analyzeResume,
  generateCoverLetter,
  generateInterviewPrep,
} from "../controllers/aiController";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /api/ai/test:
 *   get:
 *     tags:
 *       - AI
 *     summary: Test AI connection
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: AI service is connected
 *       '500':
 *         description: AI service error
 */
router.get("/test", testAiConnection);

/**
 * @openapi
 * /api/ai/analyze-resume:
 *   post:
 *     tags:
 *       - AI
 *     summary: Analyze resume with AI
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - resumeId
 *             properties:
 *               resumeId:
 *                 type: string
 *               jobDescription:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Resume analysis with feedback and scores
 *       '400':
 *         description: Invalid input
 */
router.post("/analyze-resume", analyzeResume);

/**
 * @openapi
 * /api/ai/generate-cover-letter:
 *   post:
 *     tags:
 *       - AI
 *     summary: Generate cover letter with AI
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - applicationId
 *             properties:
 *               applicationId:
 *                 type: string
 *               company:
 *                 type: string
 *               position:
 *                 type: string
 *               tone:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Generated cover letter
 *       '400':
 *         description: Invalid input
 */
router.post("/generate-cover-letter", generateCoverLetter);

/**
 * @openapi
 * /api/ai/generate-interview-prep:
 *   post:
 *     tags:
 *       - AI
 *     summary: Generate interview preparation with AI
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - applicationId
 *             properties:
 *               applicationId:
 *                 type: string
 *               jobDescription:
 *                 type: string
 *               company:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Interview preparation materials (questions, tips, etc.)
 *       '400':
 *         description: Invalid input
 */
router.post("/generate-interview-prep", generateInterviewPrep);

export default router;
