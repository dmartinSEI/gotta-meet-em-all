import Anthropic from "@anthropic-ai/sdk";
import { DOSSIER_SECTIONS, type SurveyData } from "./survey-fields";

const FIELD_LABELS: Partial<Record<keyof SurveyData, string>> = {};
for (const section of DOSSIER_SECTIONS) {
  for (const field of section.fields) {
    FIELD_LABELS[field.key] = field.label;
  }
}

export async function generateConsultantBio(
  name: string,
  title: string | null | undefined,
  surveyData: SurveyData
): Promise<string> {
  const qaLines: string[] = [];
  for (const [key, value] of Object.entries(surveyData)) {
    if (!value) continue;
    const label = FIELD_LABELS[key as keyof SurveyData] ?? key;
    qaLines.push(`${label}: ${value}`);
  }

  if (qaLines.length < 3) return "";

  const client = new Anthropic();
  const nameAndTitle = title ? `${name}, ${title}` : name;

  const message = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 250,
    messages: [
      {
        role: "user",
        content: `Write a 2–3 sentence profile intro for a company directory. Use the survey responses below to capture who this person is — blend their professional role and personality. Write in third person, warm but professional. Do not use bullet points or headers. Output only the sentences, nothing else.

Person: ${nameAndTitle}

Survey responses:
${qaLines.join("\n")}`,
      },
    ],
  });

  const block = message.content[0];
  return block.type === "text" ? block.text.trim() : "";
}
