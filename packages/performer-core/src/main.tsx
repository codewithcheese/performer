import ReactDOM from "react-dom/client";
import React, { useState } from "react";
import {
  Assistant,
  Generative,
  readTextContent,
  Repeat,
  User,
  useSubmit,
} from "./index.js";

if ("VITE_OPENAI_API_KEY" in import.meta.env) {
  // @ts-ignore
  globalThis.process = {
    env: { OPENAI_API_KEY: import.meta.env["VITE_OPENAI_API_KEY"] },
  };
}

function MessageInput() {
  const [message, setMessage] = useState("");
  const submit = useSubmit();
  return (
    <div>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <button
        type="submit"
        onClick={() => {
          submit(message);
          setMessage("");
        }}
      >
        Submit
      </button>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <Generative>
    <Repeat>
      <User>{(message) => readTextContent(message)}</User>
      <Assistant>{(message) => message.content}</Assistant>
    </Repeat>
    <MessageInput />
  </Generative>,
);
