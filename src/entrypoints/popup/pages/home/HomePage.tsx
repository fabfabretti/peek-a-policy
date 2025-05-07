import React, { useState } from "react";
import "./HomePage.css";

import { testResponse } from "../../types/types";

import { useNavigate } from "react-router";
import { Button, ButtonGroup } from "@heroui/button";
import { Card, CardBody, Textarea } from "@heroui/react";
import ScoreIndicator from "../../components/ScoreIndicator";

//example data

function HomePage() {
  //State
  const [isInvalid, setIsInvalid] = useState(false);

  const [fullPolicyText, setFullPolicyText] = useState("");

  const navigate = useNavigate();

  //Functions
  const handleElabora = () => {
    if (fullPolicyText == "") {
      setIsInvalid(true);
      return;
    } else {
      setIsInvalid(false);
      const query = new URLSearchParams({
        data: JSON.stringify({ ...testResponse, full_text: fullPolicyText }),
      }).toString();
      navigate(`/results?${query}`);
    }
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

      <Button color="primary" variant="solid" onPress={handleElabora}>
        Start Analysis
      </Button>
    </div>
  );
}

export default HomePage;
