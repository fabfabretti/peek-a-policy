import React, { useEffect, useState } from "react";

type ScoreBadgeProps = {
  score: number;
  maxScore: number;
};

const getColor = (score: number): string => {
  if (score >= 80) return "#22c55e"; // verde
  if (score >= 50) return "#eab308"; // giallo
  return "#ef4444"; // rosso
};

const ScoreBadge = ({ score, maxScore }: ScoreBadgeProps) => {
  const [fillHeight, setFillHeight] = useState(0);
  const percent = Math.min(100, (score / maxScore) * 100);
  const fillColor = getColor(percent);

  useEffect(() => {
    requestAnimationFrame(() => setFillHeight(percent));
  }, [percent]);

  return (
    <div className="relative w-24 h-24 rounded-full border-2 border-gray-300 overflow-hidden shadow-inner">
      {/* Riempimento principale */}
      <div
        className="absolute bottom-0 left-0 w-full transition-all duration-1000 ease-out"
        style={{
          height: `${fillHeight}%`,
          backgroundColor: fillColor,
        }}
      />

      {/* Onda animata */}
      <div
        className="absolute left-0 w-full transition-all duration-1000 ease-out"
        style={{
          bottom: `${fillHeight - 7}%`,
        }}
      >
        <svg
          viewBox="0 0 100 20"
          preserveAspectRatio="none"
          height="20"
          className="w-full"
        >
          <path
            fill={fillColor}
            style={{ transition: "fill 1s ease-in-out" }}
            d="M0 10 Q16.67 5 33.33 10 Q50 15 66.67 10 Q83.33 5 100 10 V20 H0 Z"
          >
            <animate
              attributeName="d"
              dur="4s"
              repeatCount="indefinite"
              values="
                M0 10 Q16.67 5 33.33 10 Q50 15 66.67 10 Q83.33 5 100 10 V20 H0 Z;
                M0 10 Q16.67 15 33.33 10 Q50 5 66.67 10 Q83.33 15 100 10 V20 H0 Z;
                M0 10 Q16.67 5 33.33 10 Q50 15 66.67 10 Q83.33 5 100 10 V20 H0 Z
              "
            />
          </path>
        </svg>
      </div>

      {/* Testo */}
      <div className="absolute inset-0 flex items-center justify-center font-bold text-black">
        {score}/{maxScore}
      </div>
    </div>
  );
};

export default ScoreBadge;
