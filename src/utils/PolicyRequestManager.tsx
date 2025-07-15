import { browser } from "wxt/browser";
import storageAPI from "@/utils/storageAPI";
import { Settings, PolicyResponse, LLMConfig } from "@/utils/types/types";
import LLMApiManager from "./LLMAPIManager";

import { initDefaultSettingsIfNeeded } from "./initDefaultSettings";

class PolicyRequestManager {
  private static instance: PolicyRequestManager;
  private settings: Settings | null = null;
  private llm: LLMConfig | null = null;
  private client: LLMApiManager | null = null;

  private constructor() {}

  static async getInstance(): Promise<PolicyRequestManager> {
    if (!PolicyRequestManager.instance) {
      PolicyRequestManager.instance = new PolicyRequestManager();
      await PolicyRequestManager.instance.init();
    }
    return PolicyRequestManager.instance;
  }

  private async init() {
    console.log("[PRM] Loading settings...");

    await initDefaultSettingsIfNeeded();

    this.settings = (await storageAPI.get<Settings>("settings")) ?? null;

    if (!this.settings) {
      console.error("[PRM] Failed to load settings after init.");
      return;
    }

    this.llm =
      this.settings.llms.find((l) => l.id === this.settings?.activeLLM) ?? null;

    if (!this.llm) {
      console.error("[PRM] No active LLM found.");
      return;
    }

    try {
      this.client = LLMApiManager.getInstance(
        this.llm.endpoint,
        this.llm.apiKey
      );
      console.log("[PRM] LLM client initialized.");
    } catch (e) {
      console.error("[PRM] Failed to initialize LLM client:", e);
      this.client = null;
    }
  }

  async analysePolicy(policyText: string): Promise<PolicyResponse | null> {
    await this.init();
    if (!this.client || !this.settings || !this.llm) {
      console.error("[PRM] Cannot analyse: missing client or settings.");
      return null;
    }

    try {
      const promptURL = browser.runtime.getURL(
        "/prompts/summarize_bullet+ex.txt"
      );
      const promptTemplate = await fetch(promptURL).then((r) => r.text());

      const prompt = promptTemplate.replace("{{Document}}", policyText);

      const raw = await this.client.sendGenPrompt(prompt, "", this.llm.model);
      if (!raw) return null;

      const parsed: PolicyResponse = JSON.parse(raw);

      parsed.full_text = policyText;
      parsed.maxScore = parsed.maxScore ?? 100;
      parsed.indicators =
        parsed.indicators?.map((ind) => ({
          ...ind,
          maxScore: ind.maxScore ?? 5,
        })) ?? [];
      parsed.analysed_at = new Date().toISOString();
      parsed.model_used = this.llm.name;

      try {
        const tabs = await browser.tabs.query({
          active: true,
          currentWindow: true,
        });
        const url = tabs?.[0]?.url;
        parsed.domain = url ? new URL(url).hostname : undefined;
      } catch (e) {
        console.warn("[PRM] Failed to extract domain:", e);
      }

      return parsed;
    } catch (e) {
      console.error("[PRM] Error during analysis:", e);
      return null;
    }
  }
}

export default PolicyRequestManager;
