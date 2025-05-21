import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { browser } from "wxt/browser";

import "./HomePage.css";

import { Button } from "@heroui/button";
import { Textarea } from "@heroui/react";

import LLMApiManager from "../../components/LLMAPIManager";
import { Indicator } from "../../../../utils/types/types";

import storageAPI from "@/utils/storageAPI";

function HomePage() {
  // -- State
  const [fullPolicyText, setFullPolicyText] = useState("");

  const [isInvalid, setIsInvalid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  //This is just for debug
  const [responseText, setResponseText] = useState<string | null>(null);

  const navigate = useNavigate();

  // -- Effects

  // Load default policy text in development mode
  //TODO check storage
  useEffect(() => {
    if (import.meta.env.MODE === "development") {
      const loadTestPolicy = async () => {
        try {
          const response = await fetch("/testdata/testpolicy.txt");
          if (!response.ok) {
            throw new Error(
              `Failed to load test policy. Status: ${response.status}`
            );
          }
          const text = await response.text();
          setFullPolicyText(text);
        } catch (error) {
          console.error("Error loading test policy:", error);
        }
      };

      loadTestPolicy();
    }
  }, []);

  // -- Functions
  const analysePolicy = async () => {
    // This is the main logic.

    if (fullPolicyText.trim() === "") {
      setIsInvalid(true);
      return;
    }

    console.log("--- Analysis started");

    setIsInvalid(false);
    setIsLoading(true);

    // 1. Summarize

    //   a. Get prompt //TODO dynamic it with settings
    try {
      const fileUrl = browser.runtime.getURL("/prompts/summarize.txt");
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error(
          `Failed to load the prompt file. Status: ${response.status}`
        );
      }
      const promptTemplate = await response.text();
      const prompt = promptTemplate.replace("{{Document}}", fullPolicyText);

      //   b. Initialize LLM and send prompt.
      // WARNING: ENV USE IS NOT RECOMMENDED BUT WE DONT HAVE A SERVER....
      const LLM = LLMApiManager.getInstance(
        import.meta.env.VITE_OPENAI_BASEURL,
        import.meta.env.VITE_OPENAI_API_KEY
      );
      const llmResponse = await LLM.sendGenPrompt(prompt, "", "gpt-4o-mini");

      //    c. Handle response
      if (llmResponse) {
        // Parse the response and add the full_text and descriptions. TODO: more indicators, so more descriptions
        const policyAnalysis = JSON.parse(llmResponse);

        // Add descriptions to indicators if they exist
        if (policyAnalysis.indicators) {
          policyAnalysis.indicators = policyAnalysis.indicators.map(
            (indicator: Indicator) => {
              if (indicator.title === "User score") {
                return {
                  ...indicator,
                  description:
                    "This score reflects how good the policy is for the end user. A higher score means the policy is more respectful of user privacy.",
                };
              } else if (indicator.title === "Law score") {
                return {
                  ...indicator,
                  description:
                    "This score reflects how complete and clear the policy is from a legal perspective. A higher score means the policy is more compliant with legal requirements.",
                };
              }
              return indicator;
            }
          );
        }

        // Add the full_text field manually to the response
        const responseWithFullText = {
          ...policyAnalysis,
          full_text: fullPolicyText,
        };

        setResponseText(JSON.stringify(responseWithFullText)); // Update the response state
        console.log(responseText);

        // 2. SAVE RESULT TO LOCALSTORAGE.

        //   a. Get domain..
        let domain: null | string = null;
        try {
          const tabs = await browser.tabs.query({
            active: true,
            currentWindow: true,
          });
          if (tabs && tabs.length > 0) {
            const url = tabs[0].url;
            if (url === "about:blank") {
              domain = "about_blank";
            } else if (url) {
              const parsedURL = new URL(url);
              domain = parsedURL.hostname;
            } else {
              console.log("Could not retrieve page URL.");
            }
          }
        } catch (error) {
          console.error("Error getting current tab's URL:", error);
        }

        //    b. If domain, save in localstorage with that domain.

        if (domain) {
          storageAPI.save(domain, policyAnalysis);
          console.log("Saved this analysis in: " + domain);
        }
      } else {
        console.error("Failed to get a response from the LLM.");
        setResponseText("Failed to get a response from the LLM.");
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error during policy analysis:", error.message);
      } else {
        console.error("Error during policy analysis:", error);
      }
      setResponseText("An error occurred during policy analysis.");
    } finally {
      setIsLoading(false);
    }
  };

  const forwardToResults = () => {
    if (responseText) {
      const query = new URLSearchParams({
        data: responseText,
      }).toString();
      navigate(`/results?${query}`);
    } else {
      console.error("No response to forward to the Results page.");
    }
  };

  return (
    <div className="container flex flex-col items-center gap-4 p-4">
      <div className="title-wrapper relative inline-block">
        <h1 className="title text-primary text-2xl font-bold z-10 drop-shadow-md">
          Peek-a-Policy
        </h1>
      </div>
      <p className="subtitle text-base text-gray-800 text-center">
        Paste the policy you'd like to analyse here.
      </p>
      <Textarea
        classNames={{
          inputWrapper: "data-[hover=true]:border-primary",
        }}
        placeholder="Paste your policy here..."
        minRows={10}
        maxRows={10}
        errorMessage="The policy cannot be empty."
        isInvalid={isInvalid}
        variant="bordered"
        value={fullPolicyText}
        onChange={(e) => {
          if (e.target.value === "") setIsInvalid(true);
          else setIsInvalid(false);
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
      <Button
        color="secondary"
        variant="solid"
        onPress={forwardToResults}
        disabled={!responseText}
      >
        Forward to Results
      </Button>
      <div className="response-panel mt-4 p-4 border rounded bg-gray-100 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-2">Response:</h2>
        <p className="text-sm text-gray-800 whitespace-pre-wrap">
          {responseText || "No response yet."}
        </p>
      </div>
    </div>
  );
}

export default HomePage;
