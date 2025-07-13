import { browser } from "wxt/browser";
import storageAPI from "@/utils/storageAPI";
import { Settings, PolicyResponse, LLMConfig } from "@/utils/types/types";
import LLMApiManager from "./LLMAPIManager";

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
    const loaded = await storageAPI.get<Settings>("settings");
    this.settings = loaded ?? null;

    if (!this.settings) {
      console.error("[PRM] Failed to load settings.");
      return;
    }

    this.llm =
      this.settings.llms.find((llm) => llm.id === this.settings?.activeLLM) ??
      null;

    if (!this.llm) {
      console.error("[PRM] No active LLM found.");
      return;
    }

    try {
      this.client = LLMApiManager.getInstance(
        this.llm.endpoint,
        this.llm.apiKey
      );
      console.log("[PRM] LLM client initialized");
    } catch (e) {
      console.error("[PRM] Failed to initialize LLM client:", e);
      this.client = null;
    }
  }

  async analysePolicy(policyText: string): Promise<PolicyResponse | null> {
    if (!this.client || !this.settings || !this.llm) {
      console.error("[PRM] Cannot analyse: missing client or settings.");
      return null;
    }

    console.log("[PRM] Building prompt...");
    const summaryLength = this.settings.promptSummaryLength || 150;

    try {
      const fileUrl = browser.runtime.getURL("/prompts/summarize.txt");
      const promptTemplate = await fetch(fileUrl).then((r) => r.text());

      const prompt = promptTemplate
        .replace("{{Document}}", policyText)
        .replace("{{SummaryLength}}", summaryLength.toString());

      console.log("[PRM] Sending prompt to model...");
      const rawResponse = await this.client.sendGenPrompt(
        prompt,
        "",
        "gpt-4o-mini"
      );

      if (!rawResponse) {
        console.error("[PRM] LLM returned null.");
        return null;
      }

      const parsed: PolicyResponse = JSON.parse(rawResponse);
      parsed.full_text = policyText;

      console.log("[PRM] Response received and parsed.");
      return parsed;
    } catch (e) {
      console.error("[PRM] Error during analysis:", e);
      return null;
    }
  }
}

export default PolicyRequestManager;
