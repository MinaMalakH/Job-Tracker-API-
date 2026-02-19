import { Router } from "express";
import { testAiConnection, analyzeResume } from "../controllers/aiController";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.get("/test", testAiConnection);
router.post("/analyze-resume", analyzeResume);

export default router;
