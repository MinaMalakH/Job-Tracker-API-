import { Router } from "express";
import { testAiConnection } from "../controllers/aiController";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.get("/test", testAiConnection);

export default router;
