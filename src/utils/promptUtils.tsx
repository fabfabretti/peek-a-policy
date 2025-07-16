import { Settings } from "./types/types";

export const GDPR_EXAMPLES: Record<string, string> = {
  "Who collects the data": "The data is collected by **Wikimedia Foundation**.",
  "Contact details of the controller":
    "You can contact them at **privacy@wikimedia.org**.",
  "Contact details of the DPO (if mentioned)":
    "The policy mentions a DPO named **Vincent Rezzouk-Hammachi**.",
  "Why the data is collected and the legal reason":
    "Data is collected to improve the service, based on _legitimate interest_.",
  "Any legitimate interests mentioned":
    "Improving user experience is stated as a **legitimate interest**.",
  "Who the data is shared with":
    "Data may be shared with **service providers** and **legal authorities**.",
  "Whether data is transferred outside the EU":
    "Some data is transferred to **the United States** and _other countries_.",
  "How long data is kept":
    "Data is usually kept for **90 days**, but some items are kept _permanently_.",
  "The rights people have over their data":
    "Users can **access**, **correct**, **delete**, or _limit_ their data.",
  "Whether consent can be withdrawn": "Consent can be withdrawn _at any time_.",
  "Whether complaints can be sent to a privacy authority":
    "Complaints can be filed with a **privacy authority**.",
  "If giving data is required and what happens if not":
    "It is _not clear_ if giving data is required, but it _may be necessary_ for some features.",
  "Whether automated decisions or profiling are used":
    "The policy does not clearly mention **automated decisions**.",
};

export const GDPR_FIELDS = Object.keys(GDPR_EXAMPLES);

export function generateExampleSummary(fields: string[]): string {
  const lines = fields
    .map((field) => GDPR_EXAMPLES[field])
    .filter(Boolean)
    .map((line) => `- ${line}`)
    .join("\\n");

  return `{
  "summary": "${lines}"
}`;
}

export function generateGDPRPrompt(
  document: string,
  settings: Settings
): string {
  const activeFields = settings.activeGDPRFields ?? GDPR_FIELDS;
  const bulletPoints = activeFields.map((field) => `- ${field}`).join("\n");
  const exampleSummary = generateExampleSummary(activeFields);

  return `Summarize the following privacy policy according to Article 13 of the GDPR.

Write in simple, clear English suitable for a Grade 6 reading level.  
Your output must be a valid JSON object with a single key: "summary", whose value is a **single string** (not an array). Do not use code blocks or formatting outside the JSON.

The summary must be a bullet-point list as a **single string**, where each bullet starts with \`-\` and covers these topics:

${bulletPoints}

Use **bold** (with \`**\`) for names, countries, or time spans, and _italics_ (with \`_\`) for optional parts.

TEXT:
${document}

Example output:
${exampleSummary}

If the input is not a privacy policy, return:

{
  "error": "The provided text is not a privacy policy."
}`;
}
