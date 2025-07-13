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
        alert("Analysis failed.");
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
      alert("Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-[480px] p-4 flex flex-col items-center gap-4">
      <div className="title-wrapper relative inline-block">
        <h1 className="title text-primary text-2xl font-bold z-10 drop-shadow-md">
          Peek-a-Policy
        </h1>
      </div>

      <p className="subtitle text-base text-gray-800 text-center">
        Paste the policy you'd like to analyse here.
      </p>

      {/* ✅ Banner per dominio già analizzato */}
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
      <Button
        color="primary"
        variant="solid"
        onPress={analysePolicy}
        disabled={isLoading}
      >
        {isLoading ? "Loading..." : "Start Analysis"}
      </Button>
    </div>
  );
}

export default HomePage;
