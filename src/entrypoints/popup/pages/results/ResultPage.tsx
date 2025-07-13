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
  const [policy, setPolicy] = useState<PolicyResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const tabs = await browser.tabs.query({
          active: true,
          currentWindow: true,
        });
        const url = tabs?.[0]?.url;
        if (!url) throw new Error("No URL");
        const domain = new URL(url).hostname;
        const result = await storageAPI.get<PolicyResponse>(domain);
        setPolicy(result ?? null);

        const settings = await storageAPI.get<Settings>("settings");
        if (settings && !settings.useCache) {
          await storageAPI.delete(domain);
        }
      } catch (e) {
        console.error("[ResultPage] Failed:", e);
        setPolicy(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="container text-sm text-gray-600 p-4 text-center">
        Loading result...
      </div>
    );
  }

  if (!policy) {
    return (
      <div className="container flex flex-col items-center gap-3 p-4">
        <h2 className="text-red-500 font-semibold text-sm">
          Invalid or missing data
        </h2>
        <Button
          color="primary"
          onPress={() => navigate("/?noRedirect=1")}
          className="text-sm"
        >
          Back to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="w-[480px] p-4 flex flex-col items-center gap-4">
      {/* Titolo */}
      <h1 className="text-lg font-bold text-primary text-center">
        Analysis Result
      </h1>

      {/* Metadati */}
      <div className="text-xs text-gray-600 text-center space-y-1">
        {policy.domain && (
          <div>
            Domain:{" "}
            <span className="font-medium break-words">{policy.domain}</span>
          </div>
        )}
        {policy.model_used && <div>Model used: {policy.model_used}</div>}
        {policy.analysed_at && (
          <div>
            Analysed at: {new Date(policy.analysed_at).toLocaleString()}
          </div>
        )}
      </div>

      {/* Score principale */}
      <div className="mt-2">
        <ScoreBadge score={policy.score ?? 0} maxScore={policy.maxScore} />
        <div className="text-xs text-center text-gray-700 mt-1">
          Overall Score
        </div>
      </div>

      {/* Riassunto */}
      <Card className="w-full p-3 bg-white shadow-sm">
        <h2 className="text-sm font-semibold mb-1">Policy Summary</h2>
        <p className="text-xs text-gray-800">{policy.summary}</p>
      </Card>

      {/* Indicatori */}
      <div className="flex flex-row gap-3 mt-1 w-full justify-between">
        {policy.indicators?.map((ind, i) => (
          <div
            key={i}
            className="flex-1 flex flex-col items-center gap-1 text-center"
          >
            <ScoreBadge score={ind.score} maxScore={ind.maxScore} />
            <div className="text-xs font-medium text-gray-800">{ind.title}</div>
            <p className="text-[11px] text-gray-600 px-1">{ind.details}</p>
          </div>
        ))}
      </div>

      {/* Back */}
      <Button
        color="primary"
        variant="solid"
        onPress={() => navigate("/?noRedirect=1")}
        className="mt-2 text-sm"
      >
        Back to Home
      </Button>
    </div>
  );
};

export default ResultPage;
