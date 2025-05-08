import OpenAI from "openai";
import { APIError, APIConnectionError, RateLimitError } from "openai/error";

// Non più necessaria la funzione formatErrorForAlert

/**
 * LLMApiManager is a Singleton class responsible for managing interactions
 * with an OpenAI-compatible LLM API.
 * Its configuration (baseURL, apiKey) can be updated via subsequent calls to getInstance.
 */
export class LLMApiManager {
  private static instance: LLMApiManager | null = null;
  private client: OpenAI;
  private static currentConfiguredBaseURL: string | null = null;
  private static currentConfiguredApiKey: string | null = null;

  /**
   * Private constructor to enforce the Singleton pattern.
   * Initializes the OpenAI client with the provided baseURL and apiKey.
   * @param baseURL The base URL for the LLM API.
   * @param apiKey The API key for authentication.
   * @throws Error if the OpenAI client fails to initialize.
   */
  private constructor(baseURL: string, apiKey: string) {
    try {
      this.client = new OpenAI({
        apiKey: apiKey,
        baseURL: baseURL,
        dangerouslyAllowBrowser: true,
      });
    } catch (e: any) {
      // RIPRISTINATO: console.error
      console.error(
        `Failed to initialize OpenAI client with baseURL "${baseURL}": ${e.message}`
      );
      throw new Error(`Failed to initialize OpenAI client: ${e.message}`);
    }
  }

  /**
   * Gets or creates/reconfigures the Singleton instance of LLMApiManager.
   * If called with baseURL or apiKey different from the current configuration,
   * the instance will be re-initialized with the new parameters.
   *
   * @param baseURL The base URL for the LLM API.
   * @param apiKey The API key for authentication.
   * @returns The LLMApiManager instance.
   * @throws Error if baseURL or apiKey are not provided, or if client re-initialization fails.
   */
  public static getInstance(baseURL: string, apiKey: string): LLMApiManager {
    if (!baseURL || !apiKey) {
      // L'originale lanciava un errore, che è corretto.
      // Non c'era un console.error qui prima.
      throw new Error("BaseURL and APIKey must be provided to getInstance.");
    }

    if (
      !LLMApiManager.instance ||
      LLMApiManager.currentConfiguredBaseURL !== baseURL ||
      LLMApiManager.currentConfiguredApiKey !== apiKey
    ) {
      try {
        LLMApiManager.instance = new LLMApiManager(baseURL, apiKey);
        LLMApiManager.currentConfiguredBaseURL = baseURL;
        LLMApiManager.currentConfiguredApiKey = apiKey;
      } catch (error) {
        LLMApiManager.instance = null;
        LLMApiManager.currentConfiguredBaseURL = null;
        LLMApiManager.currentConfiguredApiKey = null;
        // L'errore viene già loggato (ora come console.error) dal costruttore
        throw error;
      }
    }
    return LLMApiManager.instance!;
  }

  /**
   * Sends a prompt to the configured LLM API and returns the generated response.
   *
   * @param prompt The user's prompt.
   * @param sysprompt The system prompt or instruction (optional).
   * @param model The name or ID of the model to use (e.g., "gpt-3.5-turbo", "llama3").
   * @param temperature Optional. The sampling temperature to use (between 0 and 2).
   *                    If not provided, the API's default will be used (typically 1).
   * @returns A Promise that resolves to the LLM's generated text, or null if an error occurs.
   */
  public async sendGenPrompt(
    prompt: string,
    sysprompt: string = "",
    model: string,
    temperature?: number
  ): Promise<string | null> {
    if (!this.client) {
      // RIPRISTINATO: console.error
      console.error(
        "LLMApiManager client is not initialized. Call getInstance() first."
      );
      return null;
    }
    if (!model) {
      // RIPRISTINATO: console.error
      console.error("Model must be provided to sendGenPrompt.");
      return null;
    }

    try {
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
      if (sysprompt) {
        messages.push({ role: "system", content: sysprompt });
      }
      messages.push({ role: "user", content: prompt });

      const requestOptions: OpenAI.Chat.Completions.ChatCompletionCreateParams =
        {
          model: model,
          messages: messages,
        };

      if (temperature !== undefined) {
        requestOptions.temperature = temperature;
      }

      const response = await this.client.chat.completions.create(
        requestOptions
      );
      const response_content = response.choices[0]?.message?.content;
      return response_content ? response_content.trim() : null;
    } catch (e: any) {
      if (e instanceof APIError) {
        console.error(
          `API Error: ${e.status} ${e.message} (Code: ${e.code}, Type: ${e.type})`
        );
      } else if (e instanceof APIConnectionError) {
        console.error(`API Connection Error: ${e.message}`);
      } else if (e instanceof RateLimitError) {
        console.error(`Rate Limit Error: ${e.message}`);
      } else {
        console.error(`Unexpected error in sendGenPrompt: ${e.message || e}`);
      }
      return null;
    }
  }
}

export default LLMApiManager;
