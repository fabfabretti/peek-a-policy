export type Indicator = {
  title: string; // Title of the indicator (e.g., "User score", "Law score")
  details: string; // Explanation of the score
  score: number; // Numeric score (0-5)
  description?: string; // Optional description for the indicator
};

export type PolicyRequest = {
  full_text: string;
};

export type PolicyResponse = {
  full_text: string; // The full text of the policy
  summary: string; // A short summary of the policy
  score?: number; // Overall score for the policy
  indicators: Indicator[]; // Array of indicators
};

export const testResponse: PolicyResponse = {
  full_text: "Test full length text",
  summary: "Test summary",
  score: 85,
  indicators: [
    {
      title: "User score",
      details: "Respects user privacy",
      score: 4.5,
      description:
        "This score reflects how good the policy is for the end user. A higher score means the policy is more respectful of user privacy.",
    },
    {
      title: "Law score",
      details: "Mostly GDPR compliant",
      score: 4.0,
      description:
        "This score reflects how complete and clear the policy is from a legal perspective. A higher score means the policy is more compliant with legal requirements.",
    },
  ],
};
