import React from "react";
import ReactDOM from "react-dom/client";
import { PerformerSandpack } from "./index.js";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <PerformerSandpack showCodeEditor showConsole showFileExplorer />,
);
