export type PolicyRequest = {
  full_text: string;
};

export type PolicyResponse = {
  full_text: string;
  summary: string;
  score?: number;
  indicators?: { title: string; details: string; score: number }[];
};

export const testResponse: PolicyResponse = {
  full_text: "Test full length text",
  summary: "Test summary",
  score: 85,
  indicators: [
    { title: "Dati condivisi?", details: "Sì", score: 60 },
    { title: "Conservazione dati?", details: "12 mesi", score: 90 },
  ],
};
