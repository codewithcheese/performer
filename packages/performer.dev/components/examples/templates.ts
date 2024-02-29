import indexHtml from "../../sandpack/index.html.sandpack";
import indexJs from "../../sandpack/index.js.sandpack";
import ChatJsx from "../../sandpack/Chat.jsx.sandpack";
import stylesCss from "../../sandpack/styles.css.sandpack";

export const PERFORMER_TEMPLATE = {
  "styles.css": {
    code: stylesCss,
    hidden: true,
  },
  "/Chat.js": {
    code: ChatJsx,
    hidden: true,
  },
  "/main.jsx": {
    code: indexJs,
    hidden: true,
  },
  "/public/index.html": {
    code: indexHtml,
    hidden: true,
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
      main: "/main.jsx",
    }),
    hidden: true,
  },
};
