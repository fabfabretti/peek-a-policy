import React, { useEffect, useRef } from "react";
import { PolicyResponse } from "../../../utils/types/types";

type Props = {
  policyResponse: PolicyResponse;
};

const getColor = (score: number) => {
  if (score >= 80) return "#22c55e";
  if (score >= 50) return "#eab308";
  return "#ef4444";
};

const getRiskLabel = (score: number) => {
  if (score >= 80) return "Low Risk";
  if (score >= 50) return "Medium Risk";
  return "High Risk";
};

const computeOverallScore = (
  indicators: PolicyResponse["indicators"] | undefined,
): number => {
  if (!indicators || indicators.length === 0) return 0;
  let sum = 0;
  for (const ind of indicators) {
    const max = Number(ind?.maxScore) || 0;
    const sc = Number(ind?.score) || 0;
    sum += max > 0 ? Math.max(0, Math.min(1, sc / max)) : 0;
  }
  return Math.round((sum / indicators.length) * 100);
};

export default function ScoreBar({ policyResponse }: Props) {
  const indicators = policyResponse?.indicators ?? [];
  const scoreFromIndicators = computeOverallScore(indicators);
  const score =
    typeof policyResponse.score === "number"
      ? policyResponse.score
      : scoreFromIndicators;
  const color = getColor(score);
  const risk = getRiskLabel(score);

  const fillRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = fillRef.current;
    if (!el) return;

    // reset state for repeated mounts/updates
    el.style.transition = "none";
    el.style.transformOrigin = "left center";
    el.style.transform = "scaleX(0)";
    el.style.background = color;

    // double RAF to ensure animation triggers consistently
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transition = "transform 800ms cubic-bezier(0.22, 1, 0.36, 1)";
        el.style.transform = `scaleX(${Math.max(0, Math.min(1, score / 100))})`;
      });
    });
  }, [score, color]);

  return (
    <div
      className="pap-overall"
      aria-label={`Overall score ${score}%, ${risk}`}
    >
      <div
        className="pap-track"
        style={{
          position: "relative",
          flex: 1,
          height: 10,
          borderRadius: 999,
          overflow: "hidden",
          background: "rgba(15, 23, 42, 0.12)",
          outline: "1px solid rgba(15, 23, 42, 0.08)",
        }}
      >
        <div
          ref={fillRef}
          className="pap-fill"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            borderRadius: 999,
            transformOrigin: "left center",
            transform: "scaleX(0)",
            willChange: "transform",
          }}
        />
      </div>

      <div
        className="pap-risk"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
          fontWeight: 700,
          whiteSpace: "nowrap",
          letterSpacing: 0.2,
          color,
        }}
      >
        <span
          className="pap-dot"
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            background: "currentColor",
            display: "inline-block",
          }}
        />
        <span>{risk}</span>
      </div>
    </div>
  );
}
