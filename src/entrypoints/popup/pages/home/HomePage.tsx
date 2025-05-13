import React, { useState, useEffect } from "react";
import "./HomePage.css";

import { useNavigate } from "react-router";
import { Button } from "@heroui/button";
import { Textarea } from "@heroui/react";
import LLMApiManager from "../../components/LLMAPIManager";
import { Indicator } from "../../types/types";

function HomePage() {
  // State
  const [isInvalid, setIsInvalid] = useState(false);
  const [fullPolicyText, setFullPolicyText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [responseText, setResponseText] = useState<string | null>(null);
  const navigate = useNavigate();

  // Load default policy text in development mode
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

  // Functions
  const analysePolicy = async () => {
    if (fullPolicyText.trim() === "") {
      setIsInvalid(true);
      return;
    }

    setIsInvalid(false);
    setIsLoading(true);

    try {
      // Use browser.runtime.getURL for compatibility with WXT
      const fileUrl = browser.runtime.getURL("/prompts/summarize.txt");
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error(
          `Failed to load the prompt file. Status: ${response.status}`
        );
      }
      const promptTemplate = await response.text();

      const prompt = promptTemplate.replace("{{Document}}", fullPolicyText);

      const LLM = LLMApiManager.getInstance(
        import.meta.env.VITE_OPENAI_BASEURL,
        import.meta.env.VITE_OPENAI_API_KEY
      );

      const llmResponse = await LLM.sendGenPrompt(prompt, "", "gpt-4o-mini");

      if (llmResponse) {
        // Parse the response and add the full_text and descriptions
        const parsedResponse = JSON.parse(llmResponse);

        // Add descriptions to indicators if they exist
        if (parsedResponse.indicators) {
          parsedResponse.indicators = parsedResponse.indicators.map(
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
          ...parsedResponse,
          full_text: fullPolicyText,
        };

        setResponseText(JSON.stringify(responseWithFullText)); // Update the response state
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
