export type Indicator = {
  title: string; // Title of the indicator (e.g., "User score", "Law score")
  details: string; // Explanation of the score
  score: number; // Numeric score (0-5)
  maxScore: number; // 5
  description?: string; // Optional description for the indicator

  weight?: number; // Peso (0-1) sul punteggio complessivo, opzionale
  category?: string; // Categoria (es. "privacy", "compliance", ecc.)
};

export type PolicyResponse = {
  full_text: string; // The full text of the policy
  summary: string; // A short summary of the policy
  score?: number; // Overall score for the policy
  maxScore: number; // 100
  indicators: Indicator[]; // Array of indicators

  model_used?: string; // Modello LLM usato ("gpt-4", ecc.)
  analysed_at?: string; // Timestamp ISO della generazione
  domain?: string; // Dominio a cui la policy si riferisce
};

export type LLMConfig = {
  id: string;
  name: string;
  endpoint: string;
  apiKey: string;
};

export type Settings = {
  useCache: boolean;
  llms: LLMConfig[];
  activeLLM: string;
  promptSummaryLength: number;
};

export const testResponse: PolicyResponse = {
  full_text: "Test full length text",
  summary: "Test summary",
  score: 85,
  maxScore: 100,
  analysed_at: "2025-07-12T12:00:00Z",
  model_used: "gpt-4o-mini",
  domain: "example.com",
  indicators: [
    {
      title: "User score",
      details: "Respects user privacy",
      score: 4.5,
      maxScore: 5,
      description:
        "This score reflects how good the policy is for the end user. A higher score means the policy is more respectful of user privacy.",
      weight: 0.5,
      category: "privacy",
    },
    {
      title: "Law score",
      details: "Mostly GDPR compliant",
      score: 4.0,
      maxScore: 5,
      description:
        "This score reflects how complete and clear the policy is from a legal perspective. A higher score means the policy is more compliant with legal requirements.",
      weight: 0.5,
      category: "compliance",
    },
  ],
};
