/**
 * The content script retrieves the page's content and saves it to a location
 * inside the local storage, so that the popup script can read it and start the
 * analysis.
 * TODO: leverage the messaging system from WXT instead of using the local
 * storage.
 */

import storageAPI from "../utils/storageAPI";
import { Readability } from "@mozilla/readability";
import { onMessage } from "webext-bridge/content-script";

export default defineContentScript({
  matches: ["<all_urls>"],
  async main() {
    onMessage("GET_PAGE_TEXT", (message) => {
      console.log("[Content] GET_PAGE_TEXT received");
      console.log("[Content] Message from:", message.sender);
      const text = document.body?.innerText ?? "";
      console.log("[Content] Returning text of length:", text.length);
      return { text };
    });

    // Wait for document to fully load
    if (document.readyState !== "complete") {
      await new Promise((resolve) => {
        window.addEventListener("load", resolve, { once: true });
      });
    }
    // Add a short delay to allow dynamic content to load, if present
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Text and links to look for
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

    // Function that checks if page/links contains privary-related keywords
    function isPPLink(a: HTMLAnchorElement) {
      const text = a.textContent?.toLowerCase() || "";
      const href = a.getAttribute("href")?.toLowerCase() || "";
      // Only match if text or href contains 'privacy' or 'policy' in English
      return (
        privacyTextVariants.some((v) => text.includes(v)) ||
        privacyHrefPatterns.some((pat) => href.includes(pat))
      );
    }

    // Helper to clean up newlines and trim
    function cleanText(text: string) {
      // Remove leading/trailing whitespace, collapse all consecutive newlines to one, remove leading/trailing newlines
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

    // POLICY FINDER BEGINS...

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
        // Only fetch if same-origin
        const linkUrl = new URL(privacyLink.href, window.location.href);
        if (linkUrl.origin === window.location.origin) {
          const resp = await fetch(privacyLink.href);
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
          const html = await resp.text();
          // Wait extra time for dynamic content
          await new Promise((resolve) => setTimeout(resolve, 3000));
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, "text/html");

          const { text } = extractWithReadability(doc);
          mainContent = text;

          console.log("[Content] " + mainContent);
          if (mainContent.length > 200 && /privacy|policy/i.test(mainContent)) {
            await storageAPI.save("currentpagecontent", mainContent);
            console.log(
              "[Content] Saved privacy policy content from linked page to local storage.",
            );
            console.log("[Content] Saved content:", mainContent);
            return;
          } else {
            console.log(
              "[Content] Fetched content was too short or not relevant, falling back.",
            );
          }
        } else {
          console.log(
            "[Content] Privacy link is cross-origin, skipping fetch and falling back.",
          );
        }
      } catch (e) {
        console.error(
          "[Content] Failed to fetch or process privacy policy page:",
          e,
        );
        // fallback to current page
      }
    } else {
      console.log(
        "[Content] No privacy policy link found. Falling back to current page.",
      );
    }

    // 3b. Else, FALLBACK

    // Fallback: use Readability on current page only if it contains 'privacy' or 'policy'
    // Readability is useful to remove bloat from the page.
    const clonedDoc = document.implementation.createHTMLDocument();
    clonedDoc.documentElement.innerHTML = document.documentElement.innerHTML;

    const { text } = extractWithReadability(clonedDoc);
    mainContent = text;

    // Finally, send the policy to the popup script. TODO: THIS WILL NEED TO USE MESSAGING, NOT
    // LOCAL STORAGE.

    if (mainContent.length > 200 && /privacy|policy/i.test(mainContent)) {
      await storageAPI.save("currentpagecontent", mainContent);
      console.log("[Content] Saved main page content to local storage.");
      console.log("[Content] Saved content:", mainContent);
    } else {
      console.log(
        "[Content] No meaningful privacy content found on this page.",
      );
      await storageAPI.save("currentpagecontent", "not found");
    }
  },
});
