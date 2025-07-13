// storage.tsx
import { storage } from "wxt/utils/storage";
import { browser } from "wxt/browser";

import { PolicyResponse } from "./types/types";

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
};

export default storageAPI;
