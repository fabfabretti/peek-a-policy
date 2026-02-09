/**
 * src/popup/pages/home/HomePage.tsx
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Button } from "@heroui/button";
import { Tooltip } from "@heroui/tooltip";
import { Textarea } from "@heroui/react";
import { useSearchParams } from "react-router";
import { browser } from "wxt/browser";

import PolicyRequestManager from "@/utils/PolicyRequestManager";
import storageAPI from "@/utils/storageAPI";
import { PolicyResponse, Settings } from "@/utils/types/types";

import { sendMessage } from "webext-bridge/popup";

function HomePage() {
  const [fullPolicyText, setFullPolicyText] = useState("");
  const [isInvalid, setIsInvalid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [domainHasCache, setDomainHasCache] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [hasLLM, setHasLLM] = useState<boolean>(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const noRedirect = searchParams.get("noRedirect");
  const [autoRetrieveLoading, setAutoRetrieveLoading] = useState(false);

  useEffect(() => {
    const checkCache = async () => {
      const settings = await storageAPI.get<Settings>("settings");
      setHasLLM(!!(settings && settings.llms && settings.llms.length > 0));
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
  }, []);

  useEffect(() => {
    const checkCache = async () => {
      // ... tuo codice
    };
    checkCache();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [tab] = await browser.tabs.query({
          active: true,
          currentWindow: true,
        });
        const tabId = tab?.id;

        // DEBUG: verify tabId and destination
        console.log("[Popup] tabId =", tabId);
        if (!tabId) return;

        const destination = `content-script@${tabId}`;
        console.log("[Popup] sending GET_PAGE_TEXT to", destination);

        const res = await sendMessage("GET_PAGE_TEXT", {}, destination);

        console.log("[Popup] received:", res);

        if (res?.text) {
          console.log("[Popup] Setting policy text, length:", res.text.length);
          setFullPolicyText(res.text);
        } else {
          console.warn("[Popup] No text in response");
        }
      } catch (e) {
        console.error("[Popup] GET_PAGE_TEXT failed", e);
        console.error(
          "[Popup] Error details:",
          e instanceof Error ? e.message : String(e),
        );
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

  const handleAutoRetrieve = async () => {
    setAutoRetrieveLoading(true);
    try {
      const content = await storageAPI.get<string>("currentpagecontent");
      if (content === "not found") {
        setErrorMsg("Could not retrieve policy. Please paste it manually.");
        setFullPolicyText("");
        setIsInvalid(true);
      } else if (content) {
        setFullPolicyText(content);
        setIsInvalid(false);
      }
    } finally {
      setAutoRetrieveLoading(false);
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
      {!hasLLM && (
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
        Paste the policy you'd like to analyse here.
      </p>

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

      {/* Analyse and Auto-retrieve buttons or loading message */}
      {isLoading ? (
        <div className="text-sm text-gray-500 animate-pulse mt-2 mb-2 w-full text-center">
          Analysing policy...
        </div>
      ) : (
        <div className="w-full flex flex-row justify-center items-start gap-2 mb-2">
          <div className="flex flex-col items-center">
            <span>
              <Button
                size="sm"
                color="primary"
                variant="ghost"
                className="min-w-[120px] text-sm px-3 py-1"
                onPress={handleAutoRetrieve}
                isLoading={autoRetrieveLoading}
                disabled={autoRetrieveLoading}
              >
                🔄 Auto-retrieve
              </Button>
            </span>
            <span className="text-[10px] text-gray-400 mt-0.5">
              experimental
            </span>
          </div>
          <Button
            size="sm"
            color="primary"
            variant="solid"
            className="min-w-[120px] text-sm px-3 py-1"
            onPress={analysePolicy}
            disabled={isLoading}
          >
            Start Analysis
          </Button>
        </div>
      )}
    </div>
  );
}

export default HomePage;
