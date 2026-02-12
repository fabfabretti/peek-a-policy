import { sendMessage } from "webext-bridge/content-script";
import type { PolicyResponse } from "../../utils/types/types";

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

function computeOverallScore(analysisResult: PolicyResponse): number | null {
  // Prefer stored score if present
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
}

// Function to inject analysis summary badge in bottom right corner
export async function injectSummaryBadge() {
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

    const score = computeOverallScore(analysisResult);

    if (typeof score !== "number") {
      console.log(
        `[Content] Analysis result found but no computable score for domain: ${domain}`,
      );
      return;
    }

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
