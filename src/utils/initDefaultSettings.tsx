import storageAPI from "@/utils/storageAPI";
import { Settings, LLMConfig } from "@/utils/types/types";

export async function initDefaultSettingsIfNeeded() {
  const devMode = import.meta.env.MODE === "development";
  const existing = await storageAPI.get<Settings>("settings");

  // Se non esistono settings, inizializzali
  if (!existing) {
    const settings: Settings = {
      useCache: true,
      llms: [],
      activeLLM: "",
    };
    await storageAPI.save("settings", settings);
    console.log("[INIT] Created empty settings.");
    return;
  }

  // Se esistono, aggiorna con devLLM se serve
  if (devMode && !existing.llms.some((llm) => llm.id === "dev")) {
    const devLLM: LLMConfig = {
      id: "dev",
      name: "dev test GPT",
      endpoint: import.meta.env.VITE_OPENAI_BASEURL,
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      model: "gpt-4o-mini",
    };

    const updated: Settings = {
      ...existing,
      llms: [...existing.llms, devLLM],
      activeLLM: existing.activeLLM || "dev",
    };

    await storageAPI.save("settings", updated);
    console.log("[INIT] Injected dev LLM into existing settings.");
  }
}
