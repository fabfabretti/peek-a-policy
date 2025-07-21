import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Button } from "@heroui/button";
import { Textarea } from "@heroui/react";
import { useSearchParams } from "react-router";
import { browser } from "wxt/browser";

import PolicyRequestManager from "@/utils/PolicyRequestManager";
import storageAPI from "@/utils/storageAPI";
import { PolicyResponse, Settings } from "@/utils/types/types";

function HomePage() {
  const [fullPolicyText, setFullPolicyText] = useState("");
  const [isInvalid, setIsInvalid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [domainHasCache, setDomainHasCache] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const noRedirect = searchParams.get("noRedirect");

  useEffect(() => {
    const checkCache = async () => {
      const settings = await storageAPI.get<Settings>("settings");
      if (!settings?.useCache) return;

      const tabs = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      const url = tabs?.[0]?.url;
      if (!url) return;

      const domain = new URL(url).hostname;
      const cached = await storageAPI.get<PolicyResponse>(domain);

      if (cached && cached.summary) {
        setDomainHasCache(true);
        await storageAPI.save("last_analysis", cached);
      }
    };

    checkCache();

    if (import.meta.env.MODE === "development") {
      fetch("/testdata/testpolicy.txt")
        .then((r) => r.text())
        .then(setFullPolicyText)
        .catch((e) => console.error("Failed to load test policy:", e));
    }
  }, []);

  const analysePolicy = async () => {
    setErrorMsg("");

    if (fullPolicyText.trim() === "") {
      setIsInvalid(true);
      return;
    }

    setIsInvalid(false);
    setIsLoading(true);

    try {
      const manager = await PolicyRequestManager.getInstance();
      const result = await manager.analysePolicy(fullPolicyText);

      if (!result) {
        setErrorMsg(
          "Coudln't connect to the LLM.\n Please double check your LLM endpoint and key."
        );
        return;
      }

      if ((result as any).error) {
        setErrorMsg("The analysis failed: " + (result as any).error);
        return;
      }

      const tabs = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      const url = tabs?.[0]?.url;
      const domain = url ? new URL(url).hostname : null;

      if (domain) {
        await storageAPI.save(domain, result);
      }

      await storageAPI.save("last_analysis", result);
      navigate("/results");
    } catch (e) {
      console.error("Error during analysis:", e);
      setErrorMsg("Unexpected error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-[480px] p-4 flex flex-col items-center gap-4">
      {/* Bottone Impostazioni */}
      <div className="absolute top-2 right-2">
        <Button
          size="sm"
          color="primary"
          variant="ghost"
          className="px-2 py-1"
          onPress={() => navigate("/settings")}
        >
          ⚙️
        </Button>
      </div>

      <div className="title-wrapper relative inline-block">
        <h1 className="title text-primary text-2xl font-bold z-10 drop-shadow-md">
          Peek-a-Policy
        </h1>
      </div>

      {domainHasCache && (
        <div className="w-full max-w-md border border-primary bg-primary/10 rounded-md p-3 text-sm text-primary text-center">
          This domain has already been analyzed.
          <Button
            color="primary"
            variant="ghost"
            className="mt-2 w-full"
            onPress={() => navigate("/results")}
          >
            View Results
          </Button>
        </div>
      )}

      <p className="subtitle text-base text-gray-800 text-center">
        Paste the policy you'd like to analyse here.
      </p>

      <Textarea
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

      {isLoading ? (
        <div className="text-sm text-gray-500 animate-pulse text-center mt-1">
          Analysing policy...
        </div>
      ) : (
        <Button color="primary" variant="solid" onPress={analysePolicy}>
          Start Analysis
        </Button>
      )}

      {/* Messaggio di errore */}
      {errorMsg && (
        <div className="text-sm text-red-500 whitespace-pre-line text-center mt-2">
          {errorMsg}
        </div>
      )}
    </div>
  );
}

export default HomePage;
