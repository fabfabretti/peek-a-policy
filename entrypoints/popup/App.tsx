import React, { useState } from "react";
import "./App.css";
import { useNavigate } from "react-router";
import { Button, ButtonGroup } from "@heroui/button";
import { Textarea } from "@heroui/react";
function App() {
  //State
  const [policyText, setPolicyText] = useState("");
  const [isInvalid, setIsInvalid] = useState(false);

  //Functions
  const handleElabora = () => {
    console.log("Testo elaborato:", policyText);
    // Qui puoi mettere l'azione che vuoi quando premi il bottone
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
      />
      <Button color="primary" variant="solid">
        Start Analysis
      </Button>
    </div>
  );
}

export default App;
