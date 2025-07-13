import storageAPI from "@/utils/storageAPI";
import { Settings } from "@/utils/types/types";

export async function initDefaultSettingsIfNeeded() {
  const existing = await storageAPI.get<Settings>("settings");
  if (existing) return; // già presenti

  const devMode = import.meta.env.MODE === "development";

  const settings: Settings = {
    useCache: true,
    promptSummaryLength: 150,
    llms: devMode
      ? [
          {
            id: "dev",
            name: "dev test GPT",
            endpoint: import.meta.env.VITE_OPENAI_BASEURL,
            apiKey: import.meta.env.VITE_OPENAI_API_KEY,
          },
        ]
      : [],
    activeLLM: devMode ? "dev" : "",
  };

  await storageAPI.save("settings", settings);
  console.log("[INIT] Default settings initialized.");
}
