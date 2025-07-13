import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useSearchParams } from "react-router";
import { browser } from "wxt/browser";
import { Button } from "@heroui/button";
import { Textarea } from "@heroui/react";

import storageAPI from "@/utils/storageAPI";
import LLMApiManager from "../../components/LLMAPIManager";
import { Indicator, PolicyResponse } from "@/utils/types/types";
import ScoreBadge from "../../components/ScoreBadge";
import "./HomePage.css";

const getDomainName = async (): Promise<string | null> => {
  try {
    const tabs = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });
    const url = tabs?.[0]?.url;
    if (!url) return null;
    return url === "about:blank" ? "about_blank" : new URL(url).hostname;
  } catch (e) {
    console.error("getDomainName error:", e);
    return null;
  }
};

function HomePage() {
  const [fullPolicyText, setFullPolicyText] = useState("");
  const [isInvalid, setIsInvalid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [responseText, setResponseText] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const noRedirect = searchParams.get("noRedirect");
  const navigate = useNavigate();

  useEffect(() => {
    const checkAndRedirect = async () => {
      const domain = await getDomainName();
      if (!domain) return;
      const cached = await storageAPI.get(domain);
      if (cached && !noRedirect) {
        const query = new URLSearchParams({
          data: JSON.stringify(cached),
        }).toString();
        navigate(`/results?${query}`);
      }
    };

    checkAndRedirect();

    if (import.meta.env.MODE === "development") {
      fetch("/testdata/testpolicy.txt")
        .then((r) => r.text())
        .then(setFullPolicyText)
        .catch((e) => console.error("loadTestPolicy error:", e));
    }
  }, []);

  const analysePolicy = async () => {
    if (fullPolicyText.trim() === "") {
      setIsInvalid(true);
      return;
    }

    setIsInvalid(false);
    setIsLoading(true);

    try {
      const fileUrl = browser.runtime.getURL("/prompts/summarize.txt");
      const promptTemplate = await fetch(fileUrl).then((r) => r.text());
      const prompt = promptTemplate.replace("{{Document}}", fullPolicyText);

      const LLM = LLMApiManager.getInstance(
        import.meta.env.VITE_OPENAI_BASEURL,
        import.meta.env.VITE_OPENAI_API_KEY
      );

      const llmResponse = await LLM.sendGenPrompt(prompt, "", "gpt-4o-mini");

      if (!llmResponse) {
        setResponseText("LLM returned null");
        return;
      }

      const parsed: PolicyResponse = JSON.parse(llmResponse);

      if (parsed.indicators) {
        parsed.indicators = parsed.indicators.map((i: Indicator) => ({
          ...i,
          description:
            i.title === "User score"
              ? "This score reflects how good the policy is for the end user."
              : i.title === "Law score"
              ? "This score reflects legal compliance of the policy."
              : i.description,
        }));
      }

      const finalResponse = { ...parsed, full_text: fullPolicyText };
      setResponseText(JSON.stringify(finalResponse));

      const domain = await getDomainName();
      if (domain) await storageAPI.save(domain, finalResponse);
    } catch (e) {
      console.error("analysePolicy error:", e);
      setResponseText("Error during analysis.");
    } finally {
      setIsLoading(false);
    }
  };

  const forwardToResults = () => {
    if (!responseText) return;
    const query = new URLSearchParams({ data: responseText }).toString();
    navigate(`/results?${query}`);
  };

  return (
    <div className="flex justify-center items-start min-h-screen py-10 bg-background">
      <div className="bg-white shadow-lg rounded-xl p-6 w-full max-w-xl space-y-6 relative">
        {/* Icona impostazioni */}
        <div className="absolute top-4 right-4">
          <Button
            isIconOnly
            variant="ghost"
            color="primary"
            size="sm"
            onPress={() => navigate("/settings")}
            className="!p-1.5 transition-colors border border-primary hover:bg-primary hover:text-white"
          >
            <i className="fa-solid fa-gear text-sm"></i>
          </Button>
        </div>

        {/* Titolo */}
        <div className="text-center">
          <h1 className="text-3xl font-black text-primary drop-shadow title">
            Peek-a-Policy
          </h1>
          <p className="mt-1 text-gray-600 text-sm">
            Paste the policy you'd like to analyse here.
          </p>
        </div>

        {/* Textarea */}
        <Textarea
          classNames={{ inputWrapper: "data-[hover=true]:border-primary" }}
          placeholder="Paste your policy here..."
          minRows={10}
          maxRows={10}
          errorMessage="The policy cannot be empty."
          isInvalid={isInvalid}
          variant="bordered"
          value={fullPolicyText}
          onChange={(e) => {
            setIsInvalid(e.target.value === "");
            setFullPolicyText(e.target.value);
          }}
        />

        {/* Bottoni */}
        <div className="flex flex-col gap-3">
          <Button
            color="primary"
            variant="ghost"
            onPress={analysePolicy}
            disabled={isLoading}
            className="transition-all border border-primary hover:bg-primary hover:text-white"
          >
            {isLoading ? "Analyzing..." : "Start Analysis"}
          </Button>

          <Button
            color="secondary"
            variant="ghost"
            onPress={forwardToResults}
            disabled={!responseText}
            className="transition-all border border-secondary hover:bg-secondary hover:text-white"
          >
            Forward to Results
          </Button>
        </div>

        {/* Response box */}
        <div className="bg-gray-100 p-4 rounded-md">
          <h2 className="text-md font-semibold text-gray-700 mb-1">
            Response:
          </h2>
          <p className="text-sm text-gray-800 whitespace-pre-wrap">
            {responseText || "No response yet."}
          </p>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
