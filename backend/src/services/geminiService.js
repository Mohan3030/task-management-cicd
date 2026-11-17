import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const generateTaskNarrative = async (task) => {
  try {
    const prompt = `
      You are an AI productivity assistant.

      Analyze the following task and generate a short, useful narrative.

      Task title: ${task.title}
      Description: ${task.description || "No description provided"}
      Priority: ${task.priority}
      Status: ${task.status}

      Instructions:
      - Write 2-3 concise sentences.
      - Explain what the task means and its current situation.
      - Mention its priority and status naturally.
      - Give one practical suggestion for completing or progressing it.
      - Use simple, professional language.
      - Do not invent information.
      - Return only the narrative, without headings.
    `;

    const response = await ai.interactions.create(
      {
        model: "gemini-3.5-flash-lite",
        input: prompt,
      },
      {
        timeout_ms: 30000,
        retries: {
          attempts: 1,
        },
      },
    );
    if (!response.output_text) {
      throw new Error("Gemini returned an empty response");
    }

    return response.output_text.trim();
  } catch (error) {
    console.error("Gemini API error:", error.message);

    const serviceError = new Error(
      "Unable to generate AI narrative. Please try again later.",
    );

    serviceError.statusCode = 502;
    throw serviceError;
  }
};
