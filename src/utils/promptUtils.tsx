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

export const GDPR_EXAMPLES_CLOSER: Record<string, string> = {
  // Article 13(1)(a)
  "Who is in charge of the data and how to contact them":
    "The group in charge is **Wikimedia Foundation**. You can email them at **privacy@wikimedia.org**. They don’t have a contact person in the EU.",

  // Article 13(1)(b)
  "How to contact the Data Protection Officer (DPO), if there is one":
    "Their DPO is **Vincent Rezzouk-Hammachi**. You can write to **dpo@wikimedia.org**.",

  // Article 13(1)(c)
  "Why they collect your data and what gives them the right":
    "They collect your data to **make the site better**. They do this using **your permission** or because it helps their service.",

  // Article 13(1)(d)
  "If they have a special reason (legitimate interest) to use your data":
    "They say they want to **improve the site** and **stop bad behavior**, which they think is a good reason.",

  // Article 13(1)(e)
  "Who they share your data with":
    "They may share your data with **helpers like tech companies** or **officials if required**.",

  // Article 13(1)(f)
  "If they send your data to other countries and how they keep it safe":
    "Some data goes to the **United States**, and they use **special rules** to keep it safe.",

  // Article 13(2)(a)
  "How long they keep your data":
    "They usually keep it for **90 days**, unless the law says they need to keep it longer.",

  // Article 13(2)(b)
  "What rights you have over your data":
    "You can ask to **see**, **change**, **delete**, or **move** your data. You can also say **no** to how it’s used.",

  // Article 13(2)(c)
  "If you gave permission, you can take it back":
    "You can say **'stop using my data'** anytime. That won’t change what they did before.",

  // Article 13(2)(d)
  "You can complain to the people who protect your privacy":
    "If something feels wrong, you can tell a **privacy office** in your country.",

  // Article 13(2)(e)
  "Do you have to give your data, and what happens if you don’t":
    "Some data is **needed to use parts of the site**. If you don’t give it, some things may not work.",

  // Article 13(2)(f)
  "Do they use machines to make decisions about you":
    "They don’t say they use **automatic decisions** or **profiling**.",

  // Article 13(3)
  "If they want to use your data in a new way later":
    "They will **tell you first** if they want to use your data for something different.",
};

export const GDPR_FIELDS = Object.keys(GDPR_EXAMPLES);

export function generateExampleSummary(fields: string[]): string {
  const lines = fields
    .map((field) => GDPR_EXAMPLES[field])
    .filter(Boolean)
    .map((line) => `- ${line}`)
    .join("\n");

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

The summary must be a bullet-point list as a **single string**, where each bullet starts with \`-\`, ends with \`\\n\` and covers these topics:

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

export function generateIndicatorsPrompt(summary: string): string {
  return `Given the following privacy policy, generate a JSON object in the following format:


{
  "response": [
    {
      "title": string,        // short invented title for the topic (e.g., "Data Sharing")
      "score": number,        // number from 0 to 5, decimals allowed
      "maxScore": 5,
      "details": string,      // explain how well the policy handles this point
      "description": string   // fixed explanation of what this concept is about (e.g., what "Data Retention" means)
    }
  ]
}

You must include one entry in the array for **each bullet point** in the summary.

Guidelines:
- If the bullet is vague or the info is missing → score = 0
- If the info is harmful to the user (e.g., "data may be sold") → score = 0–1
- If neutral or unclear or otherwise not perfect → score = 2–3-4
- If clear and user-friendly → score = 5

Return only the JSON object, without any code block, preamble, or explanation.

SUMMARY:
${summary}
If you cannot process the summary, or the format is not clear, return:

{
  "error": "Reason for failure"
}`;
}
