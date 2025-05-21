import React from "react";
import { Button } from "@heroui/button";
import { useLocation, useNavigate } from "react-router";
import { Card } from "@heroui/card";
import ScoreIndicator from "../../components/ScoreIndicator";

import { PolicyResponse } from "../../../../utils/types/types";

const ResultPage: React.FC = () => {
  const navigate = useNavigate();
  const { search } = useLocation();

  // Parse the data from the URL
  const data = new URLSearchParams(search).get("data");
  let policyResponse: PolicyResponse | null = null;

  try {
    policyResponse = data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Failed to parse policy response:", error);
  }

  // Handle missing or invalid data
  if (!policyResponse) {
    return (
      <div className="container mx-auto flex flex-col items-center gap-4 p-4">
        <h2 className="text-lg font-semibold text-red-500">
          Invalid or missing data
        </h2>
        <Button
          color="primary"
          variant="solid"
          onPress={() => navigate("/")}
          className="mt-4 px-4 py-2 text-sm"
        >
          Back to Home
        </Button>
      </div>
    );
  }

  console.log("Policy Response:", policyResponse); // Debugging log

  return (
    <div className="container mx-auto flex flex-col items-center gap-4 p-4">
      {/* Summary */}
      <Card className="w-full max-w-md p-3">
        <h2 className="text-base font-semibold mb-1">Policy Summary</h2>
        <p className="text-sm">
          {policyResponse.summary || "No summary available."}
        </p>
      </Card>

      {/* Indicators */}
      {policyResponse.indicators && policyResponse.indicators.length > 0 ? (
        policyResponse.indicators.map((indicator, index) => (
          <div key={index} className="w-full max-w-md mt-4">
            <div className="flex items-center gap-1">
              <h3 className="text-sm font-semibold">{indicator.title}</h3>
              <span
                className="text-xs text-gray-500 cursor-pointer"
                title={indicator.details}
              >
                ?
              </span>
            </div>
            <ScoreIndicator
              score={indicator.score}
              color={
                indicator.score >= 4
                  ? "green"
                  : indicator.score >= 2
                  ? "yellow"
                  : "red"
              }
            />
            <p className="text-xs text-gray-600 mt-1">{indicator.details}</p>
          </div>
        ))
      ) : (
        <p className="text-sm text-gray-600 mt-4">
          No indicators available to display.
        </p>
      )}

      {/* Back Button */}
      <Button
        color="primary"
        variant="solid"
        onPress={() => navigate("/")}
        className="mt-4 px-4 py-2 text-sm"
      >
        Back to Home
      </Button>
    </div>
  );
};

export default ResultPage;
