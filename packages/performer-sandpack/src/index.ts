import {
  ClientOptions,
  loadSandpackClient,
  SandboxSetup,
} from "@codesandbox/sandpack-client";

async function main() {
  // Iframe selector or element itself
  const iframe = document.getElementById("iframe");

  // Files, environment and dependencies
  const content: SandboxSetup = {
    files: {
      // We infer dependencies and the entry point from package.json
      "/package.json": {
        code: JSON.stringify({
          main: "index.js",
          dependencies: { uuid: "latest" },
        }),
      },

      // Main file
      "/index.js": { code: `console.log(require('uuid'))` },
    },
  };

  // Optional options
  const options: ClientOptions = {};

  // Properly load and mount the bundler
  const client = await loadSandpackClient(
    iframe as HTMLIFrameElement,
    content,
    options,
  );

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
