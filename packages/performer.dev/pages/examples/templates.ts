export const PERFORMER_TEMPLATE = {
  "styles.css": {
    code: `
html, body, #root {
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
}`,
  },
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
import "./styles.css"

tailwind.config = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter var', 'sans-serif']
      }
    }
  },
}

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
    <title>Performer Sandbox</title>    
  </head>
  <body>
    <div id="root"></div>
    <script>
      
    </script>
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
};
