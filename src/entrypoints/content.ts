/**
 * The content script retrieves the page's content and saves it to a location
 * inside the local storage, so that the popup script can read it and start the
 * analysis.
 * TODO: leverage the messaging system from WXT instead of using the local
 * storage.
 */

import storageAPI from "../utils/storageAPI";
import { Readability } from "@mozilla/readability";
import { onMessage, sendMessage } from "webext-bridge/content-script";

// Helper to clean up newlines and trim
function cleanText(text: string) {
  return text
    .replace(/\n{2,}/g, "\n")
    .replace(/^\s+|\s+$/g, "")
    .replace(/^(\n)+/, "")
    .replace(/(\n)+$/, "");
}

// Helper to extract main text content from an HTML document using Readability
function extractWithReadability(doc: Document) {
  const article = new Readability(doc).parse();
  const text = cleanText(article?.textContent || "");
  return { article, text };
}

// Text variants and patterns to look for
const privacyTextVariants = [
  "privacy policy",
  "privacy & cookies",
  "privacy notice",
  "privacy statement",
  "privacy",
  "policy",
  "terms",
];
const privacyHrefPatterns = [
  "/privacy",
  "/privacy-policy",
  "/privacy_policy",
  "/privacy.html",
  "/privacy-policy.html",
  "/privacy-policy/",
  "/privacy/",
];

// Function that checks if an element is a privacy policy link
function isPPLink(a: HTMLAnchorElement) {
  const text = a.textContent?.toLowerCase() || "";
  const href = a.getAttribute("href")?.toLowerCase() || "";
  return (
    privacyTextVariants.some((v) => text.includes(v)) ||
    privacyHrefPatterns.some((pat) => href.includes(pat))
  );
}

// Main function to extract privacy policy from the current page
async function extractPrivacyPolicy(): Promise<string> {
  let privacyLink = null;
  let mainContent = "";

  // 1. Try to search in the footer first
  const footers = Array.from(document.getElementsByTagName("footer"));
  for (const footer of footers) {
    const links = Array.from(footer.getElementsByTagName("a"));
    privacyLink = links.find(isPPLink) || null;
    if (privacyLink) break;
  }

  // 2. If not found in footer, search whole document
  if (!privacyLink) {
    const links = Array.from(document.getElementsByTagName("a"));
    privacyLink = links.find(isPPLink) || null;
  }

  // 3a. If found a link, try to extract the policy
  if (privacyLink && privacyLink.href) {
    console.log("[Content] Found privacy policy link:", privacyLink.href);
    try {
      const linkUrl = new URL(privacyLink.href, window.location.href);
      if (linkUrl.origin === window.location.origin) {
        const resp = await fetch(privacyLink.href);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const html = await resp.text();
        await new Promise((resolve) => setTimeout(resolve, 3000));
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        const { text } = extractWithReadability(doc);
        mainContent = text;

        if (mainContent.length > 200 && /privacy|policy/i.test(mainContent)) {
          console.log(
            "[Content] Successfully extracted policy from linked page",
          );
          return mainContent;
        } else {
          console.log("[Content] Fetched content was too short, falling back.");
        }
      } else {
        console.log(
          "[Content] Privacy link is cross-origin, requesting background to open tab and extract.",
        );
        try {
          const bgResp = await sendMessage(
            "FETCH_VIA_TAB",
            { url: privacyLink.href },
            "background",
          );

          if ((bgResp as any)?.ok && (bgResp as any)?.text) {
            mainContent = (bgResp as any).text;
            console.log(
              "[Content] Successfully extracted policy via background tab",
            );
            return mainContent;
          } else {
            console.warn(
              "[Content] Background tab fetch failed:",
              (bgResp as any)?.error || bgResp,
            );
          }
        } catch (e) {
          console.error("[Content] Background tab error:", e);
        }
      }
    } catch (e) {
      console.error("[Content] Failed to fetch privacy policy page:", e);
    }
  } else {
    console.log(
      "[Content] No privacy policy link found, falling back to current page.",
    );
  }

  // 3b. Fallback: use Readability on current page
  const clonedDoc = document.implementation.createHTMLDocument();
  clonedDoc.documentElement.innerHTML = document.documentElement.innerHTML;
  const { text } = extractWithReadability(clonedDoc);
  mainContent = text;

  if (mainContent.length > 200 && /privacy|policy/i.test(mainContent)) {
    console.log("[Content] Extracted policy from current page");
    return mainContent;
  } else {
    console.log("[Content] No meaningful privacy content found.");
    return "not found";
  }
}

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
  },
});
