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
  indicators?: Indicator[]; // Array of indicators
  error?: string;

  model_used?: string; // Modello LLM usato ("gpt-4", ecc.)
  analysed_at?: string; // Timestamp ISO della generazione
  domain?: string; // Dominio a cui la policy si riferisce
  readability?: {
    fullText: ReadabilityInfo;
    summary: ReadabilityInfo;
  };
};

export type LLMConfig = {
  id: string;
  name: string;
  endpoint: string;
  apiKey: string;
  model: string;
};

export type Settings = {
  useCache: boolean;
  llms: LLMConfig[];
  activeLLM: string;
  activeGDPRFields: string[];
  includeReadability?: boolean;
};

export type ReadabilityInfo = {
  ease: number; // Flesch Reading Ease score
  grade: number; // Flesch-Kincaid Grade Level
  label: string; // Readable label (e.g., "standard", "difficult")
};
