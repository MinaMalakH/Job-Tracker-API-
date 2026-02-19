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
}
