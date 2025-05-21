// storage.tsx
import { storage } from "wxt/utils/storage";
import { browser } from "wxt/browser";

import { PolicyResponse } from "./types/types";

const storageAPI = {
  async save(key: string, value: PolicyResponse) {
    try {
      await storage.setItem<PolicyResponse>(`local:${key}`, value);
      console.log(`Saved ${key}`);
    } catch (e) {
      console.error(`Failed to save ${key}: ${e}`);
    }
  },
  async get(key: string): Promise<PolicyResponse | undefined> {
    try {
      const value = await storage.getItem<PolicyResponse>(`local:${key}`);
      console.log(`Retrieved ${key}`);
      return value ?? undefined;
    } catch (e) {
      console.error(`Failed to get ${key}: ${e}`);
      return undefined;
    }
  },
  async delete(key: string) {
    try {
      await storage.removeItem(`local:${key}`);
      console.log(`Deleted ${key}`);
    } catch (e) {
      console.error(`Failed to delete ${key}: ${e}`);
    }
  },
};

export default storageAPI;
