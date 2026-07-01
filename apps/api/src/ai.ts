import { createHash } from "node:crypto";
import { z } from "zod";
import type { ExplainMode } from "@english-study-shelf/shared";

export const explainSchema = z.object({
  bookId: z.string().optional(),
  selection: z.string().trim().min(1).max(2000),
  pageNumber: z.number().int().positive().optional(),
  mode: z.enum(["word", "sentence", "grammar"])
});

export function normalizeSelection(selection: string) {
  return selection.replace(/\s+/g, " ").trim();
}

export function cacheKeyFor(selection: string, mode: ExplainMode) {
  const normalized = normalizeSelection(selection).toLowerCase();
  return createHash("sha256").update(`${mode}\0${normalized}`).digest("hex");
}

export async function explainWithOpenAI(selection: string, mode: ExplainMode) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set. Add it to your local .env file.");
  }

  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content:
            "You are an English learning assistant. Explain only the selected text you receive. Be concise, practical, and suitable for an English learner."
        },
        {
          role: "user",
          content: JSON.stringify({
            selectedText: selection,
            mode,
            requestedOutput:
              "Give meaning, usage notes, grammar if relevant, one natural example, and a short Chinese explanation."
          })
        }
      ]
    })
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${details}`);
  }

  const payload = (await response.json()) as {
    output_text?: string;
    output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
  };

  const directText = payload.output_text?.trim();
  if (directText) {
    return directText;
  }

  const nestedText = payload.output
    ?.flatMap((item) => item.content ?? [])
    .map((content) => content.text)
    .filter(Boolean)
    .join("\n")
    .trim();

  if (!nestedText) {
    throw new Error("OpenAI response did not include explanation text.");
  }

  return nestedText;
}

