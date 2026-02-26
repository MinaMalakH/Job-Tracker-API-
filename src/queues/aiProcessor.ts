import { aiQueue } from "./aiQueue";
import { AiService } from "../services/aiService";
import { Application } from "../models/Application";
import { Resume } from "../models/Resume";

// Processor for analyze-resume job
aiQueue.process("analyze-resume", async (job) => {
  const {
    resumeId,
    resumeText: directText,
    jobDescription,
    applicationId,
    userId,
  } = job.data;

  try {
    let textToUse = directText || "";

    // If resumeId is provided, Load from DB
    if (resumeId) {
      const resume = await Resume.findById(resumeId);
      if (!resume || resume.userId.toString() !== userId) {
        throw new Error("Resume not found or not owned by user");
      }
      textToUse = resume.extractedText || "";
    }

    if (!textToUse.trim()) {
      throw new Error("No resume text available for analysis");
    }

    const analysis = await AiService.analyzeResume(textToUse, jobDescription);

    // Save result to application if applicationId given
    if (applicationId) {
      await Application.findOneAndUpdate(
        { _id: applicationId, userId },
        {
          $set: {
            aiSuggestions: {
              ...analysis,
              generatedAt: new Date(),
            },
          },
        },
      );
    }

    console.log(
      `Analysis job ${job.id} completed for application ${applicationId || "direct"}`,
    );
  } catch (err) {
    console.error(`Analysis job ${job.id} failed: `, err);
    throw err; // Let Bull mark it as failed
  }
});

// Optional: processor for cover letter (add if you want to queue it too)
aiQueue.process("generate-cover-letter", async (job) => {
  const {
    position,
    company,
    resumeSummary,
    jobDescription,
    applicationId,
    userId,
  } = job.data;

  try {
    const coverLetter = await AiService.generateCoverLetter(
      position,
      company,
      resumeSummary,
      jobDescription,
    );

    if (applicationId) {
      await Application.findOneAndUpdate(
        { _id: applicationId, userId },
        { $set: { coverLetter } },
      );
    }

    console.log(`Cover letter job ${job.id} completed`);
  } catch (err) {
    console.error(`Cover letter job ${job.id} failed:`, err);
    throw err;
  }
});

console.log("AI Queue processors are running");
