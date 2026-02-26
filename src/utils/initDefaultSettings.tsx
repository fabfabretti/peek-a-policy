/**
 *  utils/initDefaultSettings.tsx
 *
 * This script is used the first time the extension is started, to set up initial/default extensions
 * (and to add the dev's API KEY automatically if the extension i sset up in dev mode)
 *
 */

import storageAPI from "@/utils/storageAPI";
import { Settings, LLMConfig } from "@/utils/types/types";
import { GDPR_EXAMPLES } from "./promptUtils";
import { defaultSettings } from "@/utils/types/types";
import { defaults } from "marked";

export async function initDefaultSettingsIfNeeded() {
  const devMode = import.meta.env.MODE === "development";
  let settings = await storageAPI.get<Settings>("settings");

  // If no settings are found add the default settings to the local storage.
  if (!settings) {
    await storageAPI.save("settings", defaultSettings);
    console.log("[INIT] Created initial settings.");
    // Reload settings after saving defaults
    settings = await storageAPI.get<Settings>("settings");
  }

  // If we're in devmode, add the dev's API key from .env
  if (devMode && settings && !settings.llms.some((llm) => llm.id === "dev")) {
    const devLLM: LLMConfig = {
      id: "dev",
      name: "dev test GPT",
      endpoint: import.meta.env.VITE_OPENAI_BASEURL,
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      model: import.meta.env.VITE_OPENAI_MODEL,
    };

    const updated: Settings = {
      ...settings,
      llms: [...settings.llms, devLLM],
      activeLLM: settings.activeLLM || "dev",
    };

    await storageAPI.save("settings", updated);

    console.log("[INIT] Injected devLLM into settings.");
  }
}
