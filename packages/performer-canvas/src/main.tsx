import ReactDOM from "react-dom/client";

import App from "./App";

import "./index.css";
import { ReactFlowProvider } from "reactflow";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <ReactFlowProvider>
    <App />
  </ReactFlowProvider>,
);
