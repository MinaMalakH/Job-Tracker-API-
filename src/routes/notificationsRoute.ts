import { Router } from "express";
import { getNotifications } from "../controllers/notificationController";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /api/notifications:
 *   get:
 *     tags:
 *       - Notifications
 *     summary: Get all user notifications
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: List of notifications
 *       '401':
 *         description: Unauthorized
 */
router.get("/", getNotifications);

export default router;
