export type PolicyRequest = {
  full_text: string;
};

export type PolicyResponse = {
  full_text: string; // The full text of the policy
  summary: string; // A short summary of the policy
  score?: number; // Overall score for the policy
  indicators: { title: string; details: string; score: number }[]; // Flexible array of indicators
};

export const testResponse: PolicyResponse = {
  full_text: "Test full length text",
  summary: "Test summary",
  score: 85,
  indicators: [
    { title: "User score", details: "Respects user privacy", score: 4.5 },
    { title: "Law score", details: "Mostly GDPR compliant", score: 4.0 },
  ],
};
