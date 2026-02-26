import { Router } from "express";
import { getNotifications } from "../controllers/notificationController";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate);
router.get("/", getNotifications);

export default router;
