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

router.get("/test", testAiConnection);
router.post("/analyze-resume", analyzeResume);
router.post("/generate-cover-letter", generateCoverLetter);
router.post("/generate-interview-prep", generateInterviewPrep);

export default router;
