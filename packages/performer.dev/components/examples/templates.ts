import indexHtml from "../../examples/index.html.sandpack";
import indexJs from "../../examples/index.js.sandpack";
import ChatJsx from "../../examples/Chat.jsx.sandpack";
import stylesCss from "../../examples/styles.css.sandpack";

export const PERFORMER_TEMPLATE = {
  "styles.css": {
    code: stylesCss,
  },
  "/Chat.js": {
    code: ChatJsx,
  },
  "/index.js": {
    code: indexJs,
  },
  "/public/index.html": {
    code: indexHtml,
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
