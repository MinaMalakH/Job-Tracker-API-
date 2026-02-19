import openai from "../config/openai";
import { BadRequestError } from "../middleware/errorHandler";

export class AiService {
  /**
   * Simple test method to verify OpenAI connection
   */

  static async testConnection(
    prompt: string = "Say hello in a pirate voice",
  ): Promise<string> {
    try {
      const completion = await openai.chat.completions.create({
        model: "llama-3.3-70b-versatile", // ← Updated to current replacement
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 100,
      });

      const response = completion.choices[0]?.message?.content;

      if (!response) {
        throw new Error("No response from AI");
      }

      return response.trim();
    } catch (error: any) {
      console.error("AI API error:", error);
      if (error?.response?.status === 429) {
        throw new BadRequestError("Rate limit exceeded. Try again later.");
      }
      if (error?.response?.status === 401) {
        throw new BadRequestError("Invalid API key");
      }
      if (
        error?.response?.status === 400 &&
        error?.response?.data?.error?.message?.includes("decommissioned")
      ) {
        throw new BadRequestError(
          "Model is deprecated. Update to a current one like llama-3.3-70b-versatile",
        );
      }
      throw new BadRequestError(
        `AI API error: ${error.message || "Unknown error"}`,
      );
    }
  }

  /**
   * Analyze a resume against a job description
   * Returns structured JSON with suggestions
   */

  static async analyzeResume(
    resumeText: string,
    jobDescription: string,
  ): Promise<{
    keywords: string[];
    skillsToEmphasize: string[];
    experienceToHighlight: string[];
    missingKeywords: string[];
    recommendedChanges: string[];
    matchScore: number;
  }> {
    if (!resumeText.trim() || !jobDescription.trim()) {
      throw new BadRequestError("Resume text and job description are required");
    }

    const prompt = `
You are a professional resume consultant with 15+ years of experience in tech recruiting.

Analyze this resume against the job description below.

RESUME TEXT:
"""
${resumeText}
"""

JOB DESCRIPTION:
"""
${jobDescription}
"""

Provide a detailed analysis in **strict JSON format only** (no other text). The JSON must have exactly these keys:

{
  "keywords": ["list of important keywords from job desc that appear in resume"],
  "missingKeywords": ["keywords/skills from job desc that are MISSING from resume"],
  "skillsToEmphasize": ["skills in resume that match the job and should be highlighted more"],
  "experienceToHighlight": ["specific experiences or achievements in resume to emphasize for this role"],
  "recommendedChanges": ["bullet points of actionable suggestions to improve resume fit"],
  "matchScore": number between 0 and 100 (integer) representing overall fit
}

Be concise, accurate, and honest. Do not hallucinate missing information.
If resume is very short or job desc is unclear, still provide best-effort analysis.
`;

    try {
      const completion = await openai.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "You are a precise JSON-only response generator.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.4,
        max_tokens: 1500,
        response_format: { type: "json_object" },
      });

      const response = completion.choices[0]?.message?.content;

      if (!response) {
        throw new Error("No analysis response received from AI");
      }
      // Parse JSON safely
      let analysis;
      try {
        analysis = JSON.parse(response);
      } catch (parseErr) {
        console.error("Invalid JSON from AI:", response);
        throw new BadRequestError("AI response was not valid JSON");
      }

      // Validate structure (basic)
      if (
        !analysis.keywords ||
        !Array.isArray(analysis.missingKeywords) ||
        typeof analysis.matchScore !== "number"
      ) {
        throw new BadRequestError("AI returned incomplete analysis");
      }

      return analysis;
    } catch (error: any) {
      console.error("Resume analysis error:", error);
      throw new BadRequestError(
        `Analysis failed: ${error.message || "Unknown error"}`,
      );
    }
  }
}
