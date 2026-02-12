/**
 * The content script retrieves the page's content and saves it to a location
 * inside the local storage, so that the popup script can read it and start the
 * analysis.
 *
 */

import storageAPI from "../utils/storageAPI";
import { Readability } from "@mozilla/readability";
import { onMessage, sendMessage } from "webext-bridge/content-script";
import { PolicyResponse } from "../utils/types/types";

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

// Helper to get color based on score (matches ScoreBar.tsx)
function getColor(score: number) {
  if (score >= 80) return "#22c55e";
  if (score >= 50) return "#eab308";
  return "#ef4444";
}

// Helper to get risk label based on score (matches ScoreBar.tsx)
function getRiskLabel(score: number) {
  if (score >= 80) return "Low Risk";
  if (score >= 50) return "Medium Risk";
  return "High Risk";
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
  // 1. Check current page first using Readability
  const clonedDoc = document.implementation.createHTMLDocument();
  clonedDoc.documentElement.innerHTML = document.documentElement.innerHTML;
  const { text } = extractWithReadability(clonedDoc);

  if (text.length > 200 && /privacy|policy/i.test(text)) {
    console.log("[Content] Extracted policy from current page");
    return text;
  }

  // 2. If current page is not a PP, search for privacy policy link
  let privacyLink = null;

  // 2a. Try to search in the footer first
  const footers = Array.from(document.getElementsByTagName("footer"));
  for (const footer of footers) {
    const links = Array.from(footer.getElementsByTagName("a"));
    privacyLink = links.find(isPPLink) || null;
    if (privacyLink) break;
  }

  // 2b. If not found in footer, search whole document
  if (!privacyLink) {
    const links = Array.from(document.getElementsByTagName("a"));
    privacyLink = links.find(isPPLink) || null;
  }

  // 3. If found a link, try to extract the policy
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

        const { text: linkedText } = extractWithReadability(doc);

        if (linkedText.length > 200 && /privacy|policy/i.test(linkedText)) {
          console.log(
            "[Content] Successfully extracted policy from linked page",
          );
          return linkedText;
        } else {
          console.log("[Content] Fetched content was too short, falling back.");
        }
      } else {
        console.log(
          "[Content] Privacy link is cross-origin, requesting background to open tab and extract.",
        );
        // If a policy is found but is cross-origin, access it through BG script...
        try {
          const bgResp = await sendMessage(
            "FETCH_VIA_TAB",
            { url: privacyLink.href },
            "background",
          );

          if ((bgResp as any)?.ok && (bgResp as any)?.text) {
            const bgText = (bgResp as any).text;
            console.log(
              "[Content] Successfully extracted policy via background tab",
            );
            return bgText;
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
  }

  // 4. No meaningful privacy content found
  console.log("[Content] No meaningful privacy content found.");
  return "not found";
}
// Function to inject analysis summary badge in bottom right corner
async function injectSummaryBadge() {
  try {
    // Use the current page's domain as the key
    const domain = window.location.hostname;

    // Ask the background script for the analysis result for this domain
    const response = (await sendMessage(
      "GET_ANALYSIS_RESULT",
      { domain },
      "background",
    )) as unknown as { result?: PolicyResponse | null };

    const analysisResult = response?.result ?? null;

    if (!analysisResult) {
      console.log(
        `[Content] No analysis result found in background for domain: ${domain}`,
      );
      return;
    }

    // Compute overall score (0..100). Prefer stored score if present, otherwise derive from indicators.
    const computedScore = (() => {
      if (
        typeof analysisResult.score === "number" &&
        Number.isFinite(analysisResult.score)
      ) {
        return analysisResult.score;
      }

      const inds = analysisResult.indicators;
      if (!Array.isArray(inds) || inds.length === 0) return null;

      const hasWeights = inds.some(
        (i) => typeof i.weight === "number" && Number.isFinite(i.weight),
      );

      // Weighted: sum(w * (score/maxScore)) / sum(w) scaled to 0..100
      if (hasWeights) {
        let wSum = 0;
        let sSum = 0;

        for (const i of inds) {
          const w =
            typeof i.weight === "number" && Number.isFinite(i.weight)
              ? i.weight
              : 0;
          const max = Number(i.maxScore) || 0;
          const sc = Number(i.score) || 0;

          if (w > 0 && max > 0) {
            sSum += w * (sc / max);
            wSum += w;
          }
        }

        if (wSum <= 0) return null;
        return Math.round((sSum / wSum) * 100);
      }

      // Unweighted: sum(score) / sum(maxScore) scaled to 0..100
      let sumScore = 0;
      let sumMax = 0;

      for (const i of inds) {
        const max = Number(i.maxScore) || 0;
        const sc = Number(i.score) || 0;
        if (max > 0) {
          sumScore += sc;
          sumMax += max;
        }
      }

      if (sumMax <= 0) return null;
      return Math.round((sumScore / sumMax) * 100);
    })();

    if (typeof computedScore !== "number") {
      console.log(
        `[Content] Analysis result found but no computable score for domain: ${domain}`,
      );
      return;
    }

    const score = computedScore;
    const color = getColor(score);
    const risk = getRiskLabel(score);

    // Avoid duplicates if called multiple times
    if (document.querySelector(".pap-summary-badge")) {
      console.log(
        "[Content] Summary badge already present, skipping injection",
      );
      return;
    }

    // Create the badge container
    const badge = document.createElement("div");
    badge.className = "pap-summary-badge";
    badge.setAttribute("aria-label", `Policy analysis: ${score}%, ${risk}`);
    badge.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: white;
      padding: 8px 12px;
      border-radius: 20px;
      display: flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      user-select: none;
    `;

    // Create the dot indicator
    const dot = document.createElement("span");
    dot.style.cssText = `
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: ${color};
      display: inline-block;
      flex-shrink: 0;
    `;

    // Create the text content
    const text = document.createElement("span");
    text.textContent = `${risk} (${score}%)`;
    text.style.color = "rgb(15, 23, 42)";

    badge.appendChild(dot);
    badge.appendChild(text);

    document.body.appendChild(badge);
    console.log("[Content] Summary badge injected");
  } catch (e) {
    console.error("[Content] Error injecting summary badge:", e);
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

    // Inject analysis summary badge if available
    await injectSummaryBadge();
  },
});
