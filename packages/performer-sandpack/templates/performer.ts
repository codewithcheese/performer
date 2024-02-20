import { commonFiles } from "./common.js";

export const PERFORMER_TEMPLATE = {
  files: {
    ...commonFiles,
    "/App.js": {
      code: `export default function App() {
  return () => <system>Hello world</system>
}
`,
    },
    "/index.js": {
      code: `
import { createRoot } from "react-dom/client";
import { ChatWindow } from "@performer/playground";
import "./styles.css";

import App from "./App";

const root = createRoot(document.getElementById("root"));
root.render(
  <ChatWindow App={App}  />
);`,
    },
    "/public/index.html": {
      code: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`,
    },
    "/package.json": {
      code: JSON.stringify({
        dependencies: {
          "@performer/core": "latest",
          "@performer/playground": "latest",
          tslib: "latest",
          react: "^18.0.0",
          "react-dom": "^18.0.0",
          "react-scripts": "^5.0.0",
        },
        main: "/index.js",
      }),
    },
  },
  main: "/App.js",
  environment: "create-react-app",
};
