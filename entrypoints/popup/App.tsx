import React, { useState } from "react";
import "./App.css";

function App() {
  const [text, setText] = useState("");

  const handleTextChange = (e) => {
    setText(e.target.value);
  };

  const handleElabora = () => {
    console.log("Testo elaborato:", text);
    // Qui puoi mettere l'azione che vuoi quando premi il bottone
  };

  return (
    <div className="App">
      <h1>Elabora il Testo</h1>
      <textarea
        value={text}
        onChange={handleTextChange}
        placeholder="Incolla il testo qui..."
        rows="10"
        cols="50"
        className="textarea"
      />
      <br />
      <button onClick={handleElabora} className="button">
        Elabora
      </button>
    </div>
  );
}

export default App;
