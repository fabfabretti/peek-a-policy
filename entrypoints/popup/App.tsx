import React, { useState } from "react";
import "./App.css";
import { useNavigate } from "react-router";

function App() {
  //State
  const [policyText, setPolicyText] = useState("");

  //Functions
  const handleElabora = () => {
    console.log("Testo elaborato:", policyText);
    // Qui puoi mettere l'azione che vuoi quando premi il bottone
  };

  return (
    <div className="container">
      <div className="title-wrapper">
        <h1 id="title">Peek-a-Policy</h1>
        <div className="hands">
          <i className="fa-solid fa-hand hand left-hand"></i>
          <i className="fa-solid fa-hand hand right-hand"></i>
        </div>
      </div>

      <p className="subtitle">Paste the policy you'd like to analyse here.</p>
      <textarea
        placeholder="Incolla il testo qui..."
        value={policyText}
        onChange={(e) => setPolicyText(e.target.value)}
      ></textarea>
      <button className="dotted-shadow">Start analysis</button>
    </div>
  );
}

export default App;
