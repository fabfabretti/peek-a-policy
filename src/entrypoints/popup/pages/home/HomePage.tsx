import React, { useState } from "react";
import "./HomePage.css";

import { testResponse } from "../../types/types";

import { useNavigate } from "react-router";
import { Button, ButtonGroup } from "@heroui/button";
import { Card, CardBody, Textarea } from "@heroui/react";
import ScoreIndicator from "../../components/ScoreIndicator";

import LLMApiManager from "../../components/LLMAPIManager";

//example data

function HomePage() {
  //State
  const [isInvalid, setIsInvalid] = useState(false);
  const [fullPolicyText, setFullPolicyText] = useState("");
  const navigate = useNavigate();

  //TESTING
  const [testString, setTestString] = useState("");
  const [testLoading, setTestLoading] = useState(false);
  //Functions
  const analysePolicy = () => {
    //TODO: RIPRISTINA IL CONTROLLO CHE NON è VUOTA!
    setIsInvalid(false);
    const query = new URLSearchParams({
      data: JSON.stringify({ ...testResponse, full_text: fullPolicyText }),
    }).toString();
    navigate(`/results?${query}`);
  };

  const testFunction = async () => {
    if (fullPolicyText == "") {
      setTestString("no policy");
      return;
    }
    const LLM = LLMApiManager.getInstance(
      import.meta.env.VITE_OPENAI_BASEURL,
      import.meta.env.VITE_OPENAI_API_KEY
    );

    setTestLoading(true);
    let response = await LLM.sendGenPrompt(
      "Resume this policy in 100-150 words. Final text must be in english. Policy:" +
        fullPolicyText,
      "",
      "gpt-4o-mini"
    );

    if (response != null) {
      setTestString(response);
    }
    setTestLoading(false);
  };

  return (
    <div className="container flex flex-col items-center gap-4 p-4">
      <div className="title-wrapper relative inline-block">
        <h1 className="title text-primary text-2xl font-bold z-10 drop-shadow-md">
          Peek-a-Policy
        </h1>

        <div className="hands absolute top-1/3 w-full flex justify-between pointer-events-non">
          <i className="fa-solid fa-hand text-xl hand left-hand text-primary"></i>
          <i className="fa-solid fa-hand text-xl hand right-hand text-primary"></i>
        </div>
      </div>
      <p className="subtitle text-base text-gray-800 text-center">
        Paste the policy you'd like to analyse here.
      </p>
      <Textarea
        classNames={{
          inputWrapper: "data-[hover=true]:border-primary",
        }}
        placeholder="Incolla qui la tua policy..."
        minRows={10}
        maxRows={10}
        errorMessage="The policy cannot be empty."
        isInvalid={isInvalid}
        variant="bordered"
        value={fullPolicyText}
        onChange={(e) => {
          if (e.target.value == "") setIsInvalid(true);
          else setIsInvalid(false);
          setFullPolicyText(e.target.value);
        }}
      />
      <Button color="primary" variant="solid" onPress={analysePolicy}>
        Start Analysis
      </Button>
      ----Testing
      <br />
      {testLoading ? "loading" : testString}
      <Button color="primary" variant="solid" onPress={testFunction}>
        test
      </Button>
      {fullPolicyText}
    </div>
  );
}

export default HomePage;
