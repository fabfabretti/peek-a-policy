import { onMessage } from "webext-bridge/background";
import { browser } from "wxt/browser";
import type { Tabs } from "webextension-polyfill";

export default defineBackground(() => {
  console.log("Hello background!", { id: browser.runtime.id });

  browser.webNavigation.onCompleted.addListener((details) => {
    console.log("Page loaded");
  });

  // Listener for content script requests to fetch cross-origin pages
  onMessage("FETCH_URL", async (message) => {
    const { data } = message;
    const url = (data as any)?.url;
    console.log("[Background] FETCH_URL requested:", url);
    if (!url) return { ok: false, error: "no_url" };

    try {
      const resp = await fetch(url);
      const html = await resp.text();
      return { ok: true, status: resp.status, html };
    } catch (e) {
      console.error("[Background] FETCH_URL failed:", e);
      return { ok: false, error: String(e) };
    }
  });

  // Listener that opens a hidden/inactive tab, asks its content script to extract
  // the page content (using the same GET_PAGE_TEXT handler), then closes the tab
  // and returns the extracted text. This avoids CORS by reading the page DOM.
  onMessage("FETCH_VIA_TAB", async (message) => {
    const { data } = message;
    const url = (data as any)?.url;
    console.log("[Background] FETCH_VIA_TAB requested:", url);
    if (!url) return { ok: false, error: "no_url" };

    try {
      // Open a new inactive tab
      const tab = await browser.tabs.create({ url, active: false });
      const tabId = tab.id;
      if (!tabId) {
        return { ok: false, error: "no_tab_id" };
      }

      // Wait for tab to finish loading (with timeout)
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          browser.tabs.remove(tabId).catch(() => {});
          reject(new Error("tab_load_timeout"));
        }, 15000);

        const listener = (updatedTabId: number, changeInfo: Tabs.OnUpdatedChangeInfoType) => {
          if (updatedTabId === tabId && changeInfo.status === "complete") {
            clearTimeout(timeout);
            browser.tabs.onUpdated.removeListener(listener as any);
            resolve(undefined);
          }
        };

        browser.tabs.onUpdated.addListener(listener as any);
      });

      // Ask the content script in that tab to extract the policy
      try {
        const destination = `content-script@${tabId}`;
        const res = await (
          await import("webext-bridge/background")
        ).sendMessage("GET_PAGE_TEXT", undefined, destination);

        // Close the tab
        browser.tabs.remove(tabId).catch(() => {});

        if (res?.text) return { ok: true, text: res.text };
        return { ok: false, error: "no_text" };
      } catch (e) {
        // Ensure tab closed
        browser.tabs.remove(tabId).catch(() => {});
        console.error("[Background] Error asking content script in tab:", e);
        return { ok: false, error: String(e) };
      }
    } catch (e) {
      console.error("[Background] FETCH_VIA_TAB failed:", e);
      return { ok: false, error: String(e) };
    }
  });
});
