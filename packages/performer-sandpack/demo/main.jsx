import React from "react";
import ReactDOM from "react-dom/client";
import { Sandpack } from "@codesandbox/sandpack-react";
import { loadSandpackClient } from "@codesandbox/sandpack-client";

async function main() {
  // Iframe selector or element itself
  const iframe = document.getElementById("iframe");

  // Files, environment and dependencies
  const content = {
    files: {
      // We infer dependencies and the entry point from package.json
      "/package.json": {
        code: JSON.stringify({
          main: "index.js",
          dependencies: { uuid: "latest" },
        }),
      },

      // Main file
      "/index.js": {
        code: `const uuid = require('uuid'); console.log(uuid())`,
      },
    },
    environment: "vanilla",
  };

  // Optional options
  const options = {};

  // Properly load and mount the bundler
  const client = await loadSandpackClient(iframe, content, options);

  await new Promise((resolve) => setTimeout(resolve), 5000);

  /**
   * When you make a change, you can just run `updateSandbox`.
   * We'll automatically discover which files have changed
   * and hot reload them.
   */
  client.updateSandbox({
    files: {
      "/index.js": {
        code: `console.log('New Text!')`,
      },
    },
    entry: "/index.js",
    dependencies: {
      uuid: "latest",
    },
  });
}

main();

function App() {
  return <Sandpack template="react" />;
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
