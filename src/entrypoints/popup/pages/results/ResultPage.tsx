import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@heroui/button";
import { Accordion, AccordionItem } from "@heroui/accordion";
import { Card } from "@heroui/card";
import { Tooltip } from "@heroui/tooltip";
import ScoreBadge from "../../components/ScoreBadge";
import storageAPI from "@/utils/storageAPI";
import { PolicyResponse, Settings, Indicator } from "@/utils/types/types";
import { browser } from "wxt/browser";
import { marked } from "marked";
import PolicyRequestManager from "@/utils/PolicyRequestManager";

const getColor = (score: number): string => {
  if (score >= 80) return "#22c55e";
  if (score >= 50) return "#eab308";
  return "#ef4444";
};

const ResultPage: React.FC = () => {
  const navigate = useNavigate();
  const [policy, setPolicy] = useState<PolicyResponse | null>(null);
  const [indicators, setIndicators] = useState<Indicator[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingIndicators, setLoadingIndicators] = useState(false);
  const [domain, setDomain] = useState<string | null>(null);

  useEffect(() => {
    const loadPolicy = async () => {
      try {
        const tabs = await browser.tabs.query({
          active: true,
          currentWindow: true,
        });
        const url = tabs?.[0]?.url;
        if (!url) throw new Error("No URL");
        const domain = new URL(url).hostname;
        setDomain(domain);

        const result = await storageAPI.get<PolicyResponse>(domain);
        setPolicy(result ?? null);
        setIndicators(result?.indicators ?? null);

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

    loadPolicy();
  }, []);

  useEffect(() => {
    const fetchIndicators = async () => {
      if (!policy || indicators?.length) return;

      setLoadingIndicators(true);
      const manager = await PolicyRequestManager.getInstance();
      const enriched = await manager.enrichWithIndicators(policy);
      setIndicators(enriched.indicators ?? []);
      setLoadingIndicators(false);

      if (domain) {
        await storageAPI.save(domain, {
          ...policy,
          indicators: enriched.indicators,
        });
      }
    };

    fetchIndicators();
  }, [policy, indicators, domain]);

  if (loading) {
    return (
      <div className="w-[480px] p-4 text-sm text-gray-600 text-center">
        Loading result...
      </div>
    );
  }

  if (!policy) {
    return (
      <div className="w-[480px] p-4 flex flex-col items-center gap-3">
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
      <h1 className="text-2xl font-bold text-primary text-center break-words">
        Results for {policy.domain}
      </h1>

      <div className="flex flex-wrap justify-center gap-2 text-xs">
        {policy.model_used && (
          <span className="px-2 py-0.5 rounded-md border-2 border-primary text-primary bg-white">
            Model: {policy.model_used}
          </span>
        )}
        {policy.analysed_at && (
          <span className="px-2 py-0.5 rounded-md border-2 border-primary text-primary bg-white">
            {new Date(policy.analysed_at).toLocaleString()}
          </span>
        )}
      </div>

      <Card className="w-full p-3 bg-white shadow-sm">
        <h2 className="text-sm font-semibold mb-1">Policy Summary</h2>
        <div
          className="prose prose-sm text-gray-700 leading-snug [&>ul]:list-disc [&>ul]:pl-5 [&>ul>li]:mb-1"
          dangerouslySetInnerHTML={{ __html: marked(policy.summary || "") }}
        />
      </Card>

      {loadingIndicators && (
        <div className="text-sm text-gray-500 animate-pulse mt-2">
          Generating indicators...
        </div>
      )}

      {indicators && indicators.length > 0 && (
        <Accordion
          selectionMode="multiple"
          variant="bordered"
          className="w-full"
        >
          {[
            ...indicators.map((ind, i) => (
              <AccordionItem
                key={i}
                textValue={ind.title + ind.score + "/" + ind.maxScore}
                title=""
                startContent={
                  <div className="flex items-center gap-2">
                    <div className="w-[48px] flex items-center gap-2 pr-1">
                      <div
                        className="min-w-3 min-h-3 w-3 h-3 rounded-full shrink-0"
                        style={{
                          backgroundColor: getColor(
                            (ind.score / ind.maxScore) * 100
                          ),
                        }}
                      />
                      <span className="text-sm font-medium">
                        {ind.score}/{ind.maxScore}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium text-gray-800">
                        {ind.title}
                      </span>
                      <Tooltip content={ind.description}>
                        <span className="text-xs text-gray-500 cursor-help select-none">
                          ?
                        </span>
                      </Tooltip>
                    </div>
                  </div>
                }
              >
                <Card className="w-full mt-1 p-3 bg-white shadow-sm">
                  <p className="text-sm text-gray-800">{ind.details}</p>
                </Card>
              </AccordionItem>
            )),
            policy.readability ? (
              <AccordionItem
                key={"readability"}
                textValue={getReadability5(
                  policy.readability.fullText.ease
                ).toString()}
                title={""}
                startContent={
                  <div className="flex items-center gap-2">
                    <div className="w-[48px] flex items-center gap-2 pr-1">
                      <div
                        className="min-w-3 min-h-3 w-3 h-3 rounded-full shrink-0"
                        style={{
                          backgroundColor: getColor(
                            policy.readability.fullText.ease
                          ),
                        }}
                      />
                      <span className="text-sm font-medium">
                        {getReadability5(policy.readability.fullText.ease)}/5
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium text-gray-800">
                        {"Original Policy's readability"}
                      </span>
                      <Tooltip
                        content={
                          "This section computes whether the original policy was difficult to read."
                        }
                      >
                        <span className="text-xs text-gray-500 cursor-help select-none">
                          ?
                        </span>
                      </Tooltip>
                    </div>
                  </div>
                }
              >
                <Card className="w-full mt-1 p-3 bg-white shadow-sm">
                  <p className="text-sm text-gray-800">
                    {"The original policy's readability level can be classified as " +
                      policy.readability.fullText.label +
                      "."}
                  </p>
                </Card>
              </AccordionItem>
            ) : (
              <div></div>
            ),
          ]}
        </Accordion>
      )}

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

function getReadability5(ease: number): number {
  return Math.max(1, Math.min(5, Math.round(ease / 20)));
}
