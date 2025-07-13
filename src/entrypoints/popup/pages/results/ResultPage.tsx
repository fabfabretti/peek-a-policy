import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@heroui/button";
import { Card } from "@heroui/card";
import ScoreBadge from "../../components/ScoreBadge";
import storageAPI from "@/utils/storageAPI";
import { PolicyResponse, Settings } from "@/utils/types/types";
import { browser } from "wxt/browser";

const ResultPage: React.FC = () => {
  const navigate = useNavigate();
  const [policyResponse, setPolicyResponse] = useState<PolicyResponse | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadResult = async () => {
      try {
        const settings = await storageAPI.get<Settings>("settings");
        const useCache = settings?.useCache ?? true;

        const tabs = await browser.tabs.query({
          active: true,
          currentWindow: true,
        });
        const url = tabs?.[0]?.url;
        if (!url) throw new Error("No active tab URL");

        const domain = new URL(url).hostname;
        const cached = await storageAPI.get<PolicyResponse>(domain);

        if (!cached) throw new Error("No cached result found");

        setPolicyResponse(cached);

        if (!useCache) {
          await storageAPI.delete(domain);
        }
      } catch (e) {
        console.error("[ResultPage] Failed to load result:", e);
        setPolicyResponse(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadResult();
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto flex flex-col items-center gap-4 p-4">
        <p className="text-sm text-gray-600">Loading result...</p>
      </div>
    );
  }

  if (!policyResponse) {
    return (
      <div className="container mx-auto flex flex-col items-center gap-4 p-4">
        <h2 className="text-lg font-semibold text-red-500">
          Invalid or missing data
        </h2>
        <Button
          color="primary"
          variant="solid"
          onPress={() => navigate("/?noRedirect=1")}
          className="mt-4 px-4 py-2 text-sm"
        >
          Back to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto flex flex-col items-center gap-4 p-4">
      {/* Summary */}
      <Card className="w-full max-w-md p-3">
        <h2 className="text-base font-semibold mb-1">Policy Summary</h2>
        <p className="text-sm">{policyResponse.summary}</p>
      </Card>

      {/* Indicators */}
      {policyResponse.indicators?.length ? (
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
            <ScoreBadge score={indicator.score} maxScore={indicator.maxScore} />
            <p className="text-xs text-gray-600 mt-1">{indicator.details}</p>
          </div>
        ))
      ) : (
        <p className="text-sm text-gray-600 mt-4">No indicators available.</p>
      )}

      {/* Back Button */}
      <Button
        color="primary"
        variant="solid"
        onPress={() => navigate("/?noRedirect=1")}
        className="mt-4 px-4 py-2 text-sm"
      >
        Back to Home
      </Button>
    </div>
  );
};

export default ResultPage;
