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

  /**
   * Generate a professional cover letter
   */
  static async generateCoverLetter(
    position: string,
    company: string,
    resumeSummary: string,
    jobDescription: string,
  ): Promise<string> {
    if (!position || !company || !resumeSummary || !jobDescription) {
      throw new BadRequestError(
        "Position, company, resume summary, and job description are required ",
      );
    }

    const prompt = `
Write a professional, concise cover letter (300–400 words max) tailored for:

Position: ${position}
Company: ${company}

Candidate background (from resume):
"""
${resumeSummary}
"""

Job requirements:
"""
${jobDescription}
"""

Guidelines:
- Professional tone, enthusiastic but not over-the-top
- Highlight 2–3 relevant experiences/skills from resume that match the job
- Show genuine interest in the company/role
- End with a strong call-to-action
- Use first-person language
- Keep under 400 words

Return ONLY the cover letter text — no JSON, no extra explanations.
`;
    try {
      const completion = await openai.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content:
              "You are a professional career coach specializing in cover letters.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.6,
        max_tokens: 800,
      });

      const coverLetter = completion.choices[0]?.message?.content?.trim();

      if (!coverLetter) {
        throw new Error("No cover letter generated");
      }

      return coverLetter;
    } catch (error: any) {
      console.error("Cover letter generation error:", error);
      throw new BadRequestError(
        `Failed to generate cover letter: ${error.message || "Unknown error"}`,
      );
    }
  }

  /**
   * Generate interview questions + answer tips
   */

  static async generateInterviewPrep(
    position: string,
    company: string,
    resumeSummary?: string,
  ): Promise<{
    technicalQuestions: Array<{ question: string; tips: string }>;
    behavioralQuestions: Array<{ question: string; tips: string }>;
    companySpecificQuestions: Array<{ question: string; tips: string }>;
    scenarioQuestions: Array<{ question: string; tips: string }>;
  }> {
    if (!position || !company) {
      throw new BadRequestError("Position and company are required");
    }

    const resumeContext = resumeSummary
      ? `Candidate background from resume:\n"""\n${resumeSummary}\n"""\n`
      : "";

    const prompt = `
Generate 10 realistic interview questions for a ${position} role at ${company}.

Include exactly:
- 3 technical questions
- 3 behavioral questions
- 2 company-specific questions (research-based, realistic for ${company})
- 2 scenario-based / problem-solving questions

${resumeContext}

For each question provide:
- The question text
- 2–3 sentence brief answer tips / key points to cover

Return ONLY valid JSON with this exact structure:

{
  "technicalQuestions": [
    { "question": "...", "tips": "..." },
    ...
  ],
  "behavioralQuestions": [...],
  "companySpecificQuestions": [...],
  "scenarioQuestions": [...]
}

No extra text outside the JSON.
`;

    try {
      const completion = await openai.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content:
              "You are an expert interview coach. Respond only with valid JSON.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" },
      });
      const responseText = completion.choices[0]?.message?.content;

      if (!responseText) {
        throw new Error("No Interview prep response");
      }

      let prepData;
      try {
        prepData = JSON.parse(responseText);
      } catch (e) {
        console.error("Invalid JSON from interview prep:", responseText);
        throw new BadRequestError("Ai returned invalid JSON format");
      }

      // Basic validation
      if (!prepData.technicalQuestions?.length) {
        throw new BadRequestError("Incomplete interview prep response");
      }

      return prepData;
    } catch (error: any) {
      console.error("Interview prep error:", error);
      throw new BadRequestError(
        `Failed to generate interview prep: ${error.message || "Unknown error"} `,
      );
    }
  }
}
