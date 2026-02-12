/**
 * The content script retrieves the page's content and saves it to a location
 * inside the local storage, so that the popup script can read it and start the
 * analysis.
 */

import storageAPI from "../utils/storageAPI";
import { onMessage } from "webext-bridge/content-script";
import { extractPrivacyPolicy } from "./content/extraction";
import { injectSummaryBadge } from "./content/badge";

export default defineContentScript({
  matches: ["<all_urls>"],
  async main() {
    // Message handler: when popup requests page content, extract and return the privacy policy
    onMessage("GET_PAGE_TEXT", async (message) => {
      console.log("[Content] GET_PAGE_TEXT received from:", message.sender);
      try {
        const text = await extractPrivacyPolicy();
        console.log(
          "[Content] Returning extracted policy, length:",
          text.length,
        );
        return { text };
      } catch (e) {
        console.error("[Content] Error extracting policy:", e);
        return { text: "error" };
      }
    });

    // Wait for document to fully load
    if (document.readyState !== "complete") {
      await new Promise((resolve) => {
        window.addEventListener("load", resolve, { once: true });
      });
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // On page load, extract and cache the policy
    const content = await extractPrivacyPolicy();
    if (content !== "not found") {
      await storageAPI.save("currentpagecontent", content);
      console.log("[Content] Cached policy to storage");
    } else {
      await storageAPI.save("currentpagecontent", "not found");
    }

    // Inject analysis summary badge if available
    await injectSummaryBadge();
  },
});
