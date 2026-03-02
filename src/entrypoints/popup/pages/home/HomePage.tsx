/**
 * src/popup/pages/home/HomePage.tsx
 * Responsibilities:
 * 1. Retrieve policy text automatically from active tab
 * 2. Check cache availability for current domain
 * 3. Validate LLM configuration
 * 4. Trigger policy analysis
 * 5. Navigate to results page
 *
 * NOTE:
 * - No business logic here (delegated to PolicyRequestManager)
 * - Storage access centralized via storageAPI
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";

import { Button } from "@heroui/button";
import { Textarea } from "@heroui/react";
import { useSearchParams } from "react-router";

import { browser } from "wxt/browser";
import { sendMessage } from "webext-bridge/popup";

import PolicyRequestManager from "@/utils/PolicyRequestManager";
import storageAPI from "@/utils/storageAPI";

import { PolicyResponse, Settings } from "@/utils/types/types";

function HomePage() {
  // Types
  const [retrievalStatus, setRetrievalStatus] = useState<
    "loading" | "success" | "error" | null
  >(null);

  // Content
  const [fullPolicyText, setFullPolicyText] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Various states
  const [hasLLM, setHasLLM] = useState<boolean>(false);
  const [domainHasCache, setDomainHasCache] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [isInvalid, setIsInvalid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Navigator
  const navigate = useNavigate();

  // Effect:
  // 1. Check if LLM --> save into state
  // 2. Check if cache saved for this site --> save into state
  useEffect(() => {
    let retryTimeout: NodeJS.Timeout | null = null;

    let isMounted = true;

    // 1. Let's get the settings.

    const checkCache = async (retryCount = 0) => {
      const settings = await storageAPI.get<Settings>("settings");
      let llmConfigured = false;
      if (
        settings &&
        Array.isArray(settings.llms) &&
        settings.llms.length > 0
      ) {
        llmConfigured =
          !!settings.activeLLM &&
          settings.llms.some((l) => l.id === settings.activeLLM);
      }
      if (!settings || (!llmConfigured && retryCount < 5)) {
        // Retry up to 5 times with 100ms delay if settings are missing or not yet valid
        retryTimeout = setTimeout(() => checkCache(retryCount + 1), 100);
        return;
      }
      if (isMounted) {
        setHasLLM(llmConfigured);
        setSettingsLoading(false);
      }

      if (!settings?.useCache) return;

      const tabs = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      const url = tabs?.[0]?.url;
      if (!url) return;

      const domain = new URL(url).hostname;
      console.log("[HomePage] Checking cache for domain:", domain);
      const analysesForDomain = await storageAPI.getAnalysesForDomain(domain);
      console.log("[HomePage] Found analyses:", analysesForDomain);

      if (analysesForDomain.length > 0 && isMounted) {
        setDomainHasCache(true);
      }
    };

    checkCache();
    return () => {
      isMounted = false;
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setRetrievalStatus("loading");

        const [tab] = await browser.tabs.query({
          active: true,
          currentWindow: true,
        });
        const tabId = tab?.id;

        console.log("[Popup] tabId =", tabId);
        if (!tabId) {
          setRetrievalStatus("error");
          setTimeout(() => setRetrievalStatus(null), 3000);
          return;
        }

        const destination = `content-script@${tabId}`;
        console.log("[Popup] sending GET_PAGE_TEXT to", destination);

        const res = await sendMessage("GET_PAGE_TEXT", undefined, destination);

        console.log("[Popup] received:", res);

        if (res?.text && res.text !== "not found" && res.text !== "error") {
          console.log("[Popup] Setting policy text, length:", res.text.length);
          setFullPolicyText(res.text);
          setRetrievalStatus("success");
          setTimeout(() => setRetrievalStatus(null), 2000);
        } else {
          console.warn("[Popup] No valid text in response");
          setRetrievalStatus("error");
          setTimeout(() => setRetrievalStatus(null), 3000);
        }
      } catch (e) {
        console.error("[Popup] GET_PAGE_TEXT failed", e);
        setRetrievalStatus("error");
        setTimeout(() => setRetrievalStatus(null), 3000);
      }
    })();
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
          "Coudln't connect to the LLM.\n Please double check your LLM endpoint and key.",
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

      if (!domain) {
        setErrorMsg("Could not determine domain for this page.");
        return;
      }

      // Create composite key: domain_timestamp
      const analysisId = `${domain}_${Date.now()}`;
      await storageAPI.save(analysisId, result);
      navigate(`/results?id=${analysisId}`);
    } catch (e) {
      console.error("Error during analysis:", e);
      setErrorMsg("Unexpected error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-[480px] p-4 flex flex-col items-center gap-4">
      {/* Title row */}
      <div className="w-full flex justify-center mb-2">
        <h1 className="title text-primary text-2xl font-bold z-10 drop-shadow-md text-center">
          Peek-a-Policy
        </h1>
      </div>

      {/* Settings button in top-right */}
      <div className="absolute top-2 right-2 z-10">
        <Button
          size="sm"
          color="primary"
          variant="ghost"
          className="px-2 py-1"
          onPress={() => browser.runtime.openOptionsPage()}
        >
          ⚙️
        </Button>
      </div>

      {/* WARNING: no LLM configured */}
      {!settingsLoading && !hasLLM && (
        <div className="w-full max-w-md border border-red-300 bg-red-50 rounded-md p-3 text-sm text-red-800">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="font-semibold">No LLM configured</div>
              <div className="text-sm text-red-700">
                Please set an LLM in the Settings page to enable analysis.
              </div>
            </div>
            <div>
              <Button
                size="sm"
                variant="ghost"
                color="secondary"
                onPress={() => browser.runtime.openOptionsPage()}
                className="border border-red-200 text-red-700 hover:bg-red-100"
              >
                Open Settings
              </Button>
            </div>
          </div>
        </div>
      )}

      <p className="subtitle text-base text-gray-800 text-center">
        The extension will try to extract the policy here automatically. You can
        also paste the text manually, or paste an URL and attempt to extract the
        content.
      </p>

      {domainHasCache && (
        <div className="w-full max-w-md border border-primary bg-primary/10 rounded-md p-3 text-sm text-primary text-center">
          This domain has already been analyzed.
          <Button
            color="primary"
            variant="ghost"
            className="mt-2 w-full"
            onPress={async () => {
              try {
                const tabs = await browser.tabs.query({
                  active: true,
                  currentWindow: true,
                });
                const url = tabs?.[0]?.url;
                if (!url) return;

                const domain = new URL(url).hostname;
                const analysesForDomain =
                  await storageAPI.getAnalysesForDomain(domain);

                if (analysesForDomain.length > 0) {
                  const latestKey = analysesForDomain.sort().pop();
                  if (latestKey) {
                    navigate(`/results?id=${latestKey}`);
                  }
                }
              } catch (e) {
                console.error("[HomePage] Failed to navigate to results:", e);
              }
            }}
          >
            View Results
          </Button>
        </div>
      )}

      <Textarea
        placeholder="Paste your policy here..."
        minRows={10}
        maxRows={10}
        errorMessage={
          errorMsg || (isInvalid ? "The policy cannot be empty." : undefined)
        }
        isInvalid={!!errorMsg || isInvalid}
        variant="bordered"
        value={fullPolicyText}
        onChange={(e) => {
          setIsInvalid(e.target.value === "");
          setFullPolicyText(e.target.value);
          if (errorMsg) setErrorMsg("");
        }}
      />

      {/* Retrieval status message */}
      {retrievalStatus && (
        <div className="w-full text-sm text-gray-500 animate-pulse mt-2 mb-2 text-center">
          {retrievalStatus === "loading" && "Retrieving policy..."}
          {retrievalStatus === "success" && "Policy retrieved!"}
          {retrievalStatus === "error" &&
            "Couldn't retrieve policy, please paste it manually"}
        </div>
      )}

      {/* Analyse button or loading message */}
      {isLoading ? (
        <div className="text-sm text-gray-500 animate-pulse mt-2 mb-2 w-full text-center">
          Analysing policy...
        </div>
      ) : (
        <Button
          size="sm"
          color="primary"
          variant="solid"
          className="min-w-[120px] text-sm px-3 py-1"
          onPress={analysePolicy}
          disabled={isLoading || !fullPolicyText.trim()}
        >
          Start Analysis
        </Button>
      )}
    </div>
  );
}

export default HomePage;
