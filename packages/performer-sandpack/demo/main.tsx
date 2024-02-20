import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
  SandpackFileExplorer,
  SandpackConsole,
  SandpackPredefinedTemplate,
} from "@codesandbox/sandpack-react";
import React from "react";
import ReactDOM from "react-dom/client";
import { PERFORMER_TEMPLATE } from "../templates/performer.js";

function App() {
  return (
    <SandpackProvider
      options={{
        bundlerTimeOut: 90000,
        // bundlerURL: isNodeStatic
        //   ? undefined
        //   : "https://1-17-1-sandpack.codesandbox.io/",
      }}
      template={"react"}
      files={PERFORMER_TEMPLATE.files}
    >
      <SandpackLayout>
        <SandpackFileExplorer />
        <SandpackCodeEditor closableTabs showLineNumbers />
        <SandpackPreview showNavigator />
      </SandpackLayout>
      <br />
      <SandpackLayout>
        <SandpackConsole />
      </SandpackLayout>
    </SandpackProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
