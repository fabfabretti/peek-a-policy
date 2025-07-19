import { browser } from "wxt/browser";
import storageAPI from "@/utils/storageAPI";
import { Settings, PolicyResponse, LLMConfig } from "@/utils/types/types";
import LLMApiManager from "./LLMAPIManager";
import { initDefaultSettingsIfNeeded } from "./initDefaultSettings";
import { generateGDPRPrompt } from "./promptUtils";
import { generateIndicatorsPrompt } from "./promptUtils";
import { Indicator } from "@/utils/types/types";
import { computeReadabilityInfo } from "./readabilityUtils";

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
    console.log("[PRM] Loaded settings:", this.settings);

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
      const prompt = generateGDPRPrompt(policyText, this.settings);

      const raw = await this.client.sendGenPrompt(prompt, "", this.llm.model);
      if (!raw) return null;

      console.log(raw);

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

      parsed.readability = {
        fullText: computeReadabilityInfo(policyText),
        summary: computeReadabilityInfo(parsed.summary || ""),
      };

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
      console.log(parsed);

      return parsed;
    } catch (e) {
      console.error("[PRM] Error during analysis:", e);
      return null;
    }
  }
  async enrichWithIndicators(
    response: PolicyResponse
  ): Promise<PolicyResponse> {
    if (!this.client || !this.settings || !this.llm) {
      console.error("[PRM] Cannot enrich: missing client or settings.");
      return response;
    }

    if (!response.summary) {
      console.warn("[PRM] Cannot enrich: missing summary.");
      return response;
    }

    const prompt = generateIndicatorsPrompt(response.summary);

    try {
      const raw = await this.client.sendGenPrompt(prompt, "", this.llm.model);
      const parsed = JSON.parse(raw || "");

      if (parsed.error) {
        console.warn(
          "[PRM] LLM returned error during indicator generation:",
          parsed.error
        );
        return {
          ...response,
          indicators: [],
          error: parsed.error,
        };
      }

      let indicators = parsed.response as Indicator[];

      // Add readability indicator if enabled
      if (
        this.settings.includeReadability &&
        response.readability?.fullText?.ease != null
      ) {
        const easeScore = response.readability.fullText.ease;
        const grade = response.readability.fullText.grade;
        const label = response.readability.fullText.label || "unknown";

        const clampedEase = Math.max(0, Math.min(100, easeScore));
        const normalized = Math.round(clampedEase / 20);

        // Etichetta educativa in base al grado
        let educationLevel = "unknown";
        if (grade <= 5) educationLevel = "elementary school";
        else if (grade <= 8) educationLevel = "middle school";
        else if (grade <= 12) educationLevel = "high school";
        else if (grade <= 16) educationLevel = "university";
        else educationLevel = "postgraduate";

        indicators.push({
          title: "Readability of the original policy",
          score: normalized,
          maxScore: 5,
          details: `The original policy has a score of ${clampedEase.toFixed(
            1
          )} in the Flesch Reading Ease scale, making it suitable for grade ${Math.round(
            grade
          )} readers (${educationLevel}, ${label}).`,
          description:
            "Uses Flesch Reading Ease to estimate how difficult the original policy is to read.",
        });
      }

      return {
        ...response,
        indicators,
      };
    } catch (e) {
      console.error("[PRM] Failed to enrich with indicators:", e);
      return {
        ...response,
        indicators: [],
        error: "Failed to generate indicators",
      };
    }
  }
}

export default PolicyRequestManager;
