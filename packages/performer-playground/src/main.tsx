import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

if ("VITE_OPENAI_API_KEY" in import.meta.env) {
  // @ts-ignore
  globalThis.process = {
    env: { OPENAI_API_KEY: import.meta.env["VITE_OPENAI_API_KEY"] },
  };
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
