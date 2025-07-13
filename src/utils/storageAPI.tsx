// storage.tsx
import { storage } from "wxt/utils/storage";
import { browser } from "wxt/browser";

const storageAPI = {
  async save<T>(key: string, value: T) {
    try {
      await storage.setItem<T>(`local:${key}`, value);
      console.log(`Saved ${key}`);
    } catch (e) {
      console.error(`Failed to save ${key}: ${e}`);
    }
  },

  async get<T>(key: string): Promise<T | undefined> {
    try {
      const value = await storage.getItem<T>(`local:${key}`);
      console.log(`Retrieved ${key}`);
      return value ?? undefined;
    } catch (e) {
      console.error(`Failed to get ${key}: ${e}`);
      return undefined;
    }
  },
  async delete(key: string): Promise<void> {
    try {
      await storage.removeItem(`local:${key}`);
      console.log(`Deleted ${key}`);
    } catch (e) {
      console.error(`Failed to delete ${key}: ${e}`);
    }
  },

  async getPolicyCacheBytes(): Promise<number> {
    try {
      const all = await browser.storage.local.get(null);
      let total = 0;

      for (const [key, value] of Object.entries(all)) {
        if (key.startsWith("local:") && key !== "local:settings") {
          total += new Blob([JSON.stringify(value)]).size;
        }
      }

      return total;
    } catch (e) {
      console.error("Failed to calculate policy cache size:", e);
      return 0;
    }
  },

  async clearPolicyCache() {
    try {
      const all = await browser.storage.local.get(null);
      const keys = Object.keys(all);
      const toDelete = keys.filter(
        (key) => key.startsWith("local:") && key !== "local:settings"
      );

      for (const key of toDelete) {
        await browser.storage.local.remove(key);
      }

      console.log("Cleared policy cache");
    } catch (e) {
      console.error("Failed to clear policy cache:", e);
    }
  },
};

export default storageAPI;
