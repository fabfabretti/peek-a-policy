import storageAPI from "../utils/storageAPI";
import { Readability } from "@mozilla/readability";

export default defineContentScript({
  matches: ["<all_urls>"],
  async main() {
    console.log("Hello content.");
    // Wait for the page to be fully loaded (including images, scripts, etc.)
    if (document.readyState !== "complete") {
      await new Promise((resolve) => {
        window.addEventListener("load", resolve, { once: true });
      });
    }
    // Add a short delay to allow dynamic content to load
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Improved: Only English, search by text and href, common URL patterns
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
    let privacyLink = null;
    function isEnglishPrivacyLink(a: HTMLAnchorElement) {
      const text = a.textContent?.toLowerCase() || "";
      const href = a.getAttribute("href")?.toLowerCase() || "";
      // Only match if text or href contains 'privacy' or 'policy' in English
      return (
        privacyTextVariants.some((v) => text.includes(v)) ||
        privacyHrefPatterns.some((pat) => href.includes(pat))
      );
    }
    // Try to search in the footer first
    const footers = Array.from(document.getElementsByTagName("footer"));
    for (const footer of footers) {
      const links = Array.from(footer.getElementsByTagName("a"));
      privacyLink = links.find(isEnglishPrivacyLink) || null;
      if (privacyLink) break;
    }
    // If not found in footer, search whole document
    if (!privacyLink) {
      const links = Array.from(document.getElementsByTagName("a"));
      privacyLink = links.find(isEnglishPrivacyLink) || null;
    }

    let mainContent = "";
    // Helper to clean up newlines and trim
    function cleanText(text: string) {
      // Remove leading/trailing whitespace, collapse all consecutive newlines to one, remove leading/trailing newlines
      return text
        .replace(/\n{2,}/g, "\n")
        .replace(/^\s+|\s+$/g, "")
        .replace(/^(\n)+/, "")
        .replace(/(\n)+$/, "");
    }
    if (privacyLink && privacyLink.href) {
      console.log("Found privacy policy link:", privacyLink.href);
      try {
        // Only fetch if same-origin
        const linkUrl = new URL(privacyLink.href, window.location.href);
        if (linkUrl.origin === window.location.origin) {
          const resp = await fetch(privacyLink.href);
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
          const html = await resp.text();
          // Wait extra time for dynamic content (e.g., 5 seconds)
          await new Promise((resolve) => setTimeout(resolve, 3000));
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, "text/html");
          const article = new Readability(doc).parse();
          mainContent = cleanText(article?.textContent || "");
          console.log(mainContent);
          if (mainContent.length > 200 && /privacy|policy/i.test(mainContent)) {
            await storageAPI.save("currentpagecontent", mainContent);
            console.log(
              "Saved privacy policy content from linked page to local storage."
            );
            console.log("Saved content:", mainContent);
            return;
          } else {
            console.log(
              "Fetched content was too short or not relevant, falling back."
            );
          }
        } else {
          console.log(
            "Privacy link is cross-origin, skipping fetch and falling back."
          );
        }
      } catch (e) {
        console.error("Failed to fetch or process privacy policy page:", e);
        // fallback to current page
      }
    } else {
      console.log(
        "No privacy policy link found. Falling back to current page."
      );
    }

    // Fallback: use Readability on current page only if it contains 'privacy' or 'policy'
    const clonedDoc = document.implementation.createHTMLDocument();
    clonedDoc.documentElement.innerHTML = document.documentElement.innerHTML;
    const article = new Readability(clonedDoc).parse();
    mainContent = cleanText(article?.textContent || "");
    if (mainContent.length > 200 && /privacy|policy/i.test(mainContent)) {
      await storageAPI.save("currentpagecontent", mainContent);
      console.log("Saved main page content to local storage.");
      console.log("Saved content:", mainContent);
    } else {
      console.log("No meaningful privacy content found on this page.");
      await storageAPI.save("currentpagecontent", "not found");
    }
  },
});
