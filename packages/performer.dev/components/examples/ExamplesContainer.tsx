import React, { useEffect, useState } from "react";
import { TableOfContents } from "./TableOfContents.tsx";
import {
  SandpackCodeEditor,
  SandpackPreview,
  SandpackProvider,
} from "@codesandbox/sandpack-react";
import { createHashRouter } from "react-router-dom";
import { PERFORMER_TEMPLATE } from "./templates.ts";

import messagesCode from "../../sandpack/examples/01-messages.jsx.sandpack";
import assistantCode from "../../sandpack/examples/02-Assistant.jsx.sandpack";

console.log("content", messagesCode);

const sections = [
  {
    title: "Introduction",
    examples: [
      {
        slug: "messages",
        title: "Messages",
        files: {
          "/App.js": { code: messagesCode },
        },
      },
      {
        slug: "assistant",
        title: "Assistant",
        files: {
          "/App.js": { code: assistantCode },
        },
      },
    ],
  },
];

const examplesBySlug = new Map(
  sections
    .map((section) => section.examples)
    .flat()
    .map((example) => {
      return [example.slug, example];
    }),
);

const ExamplesContainer = ({ data }) => {
  const [example, setExample] = useState(sections[0].examples[0]);
  const [router, setRouter] = useState();

  useEffect(() => {
    const router = createHashRouter([
      {
        path: "/",
        element: <></>,
        children: Array.from(examplesBySlug.values()).map((example) => {
          return {
            path: example.slug,
            element: <></>,
            example,
          };
        }),
      },
    ]);
    router.subscribe((evt) => {
      // @ts-ignore
      setExample(evt.matches[1].route.example);
    });

    setRouter(router);
  }, []);

  return (
    <>
      <div className="h-full flex flex-col md:flex-row">
        <div className="w-full md:w-[36ch] md:border-r md:border-gray-200">
          <TableOfContents
            sections={sections}
            activeSection="messages"
            isLoading={false}
            goto={(path) => router.navigate(path)}
          />
        </div>

        <SandpackProvider
          files={{ ...PERFORMER_TEMPLATE, ...example.files }}
          options={{
            autoReload: true,
            externalResources: [
              "https://cdn.tailwindcss.com",
              "https://rsms.me/inter/inter.css",
            ],
            classes: {
              "sp-wrapper": "examples-sp-wrapper",
              "sp-stack": "examples-sp-stack",
              "sp-tab-button": "examples-sp-tab",
            },
          }}
          template="react"
        >
          <div className="flex flex-col flex-1 lg:flex-row">
            <div className="w-full overflow-auto flex-1 bg-green-200 md:border-r md:border-gray-200">
              <SandpackCodeEditor wrapContent />
            </div>
            <div className="w-full overflow-auto flex-1 bg-blue-200 md:border-r md:border-gray-200">
              <SandpackPreview />
            </div>
          </div>
        </SandpackProvider>
      </div>

      <div className="flex md:hidden justify-between p-4">
        <button id="btnColumn1" className="bg-gray-300 p-2">
          Column 1
        </button>
        <button id="btnColumn2" className="bg-gray-300 p-2">
          Column 2
        </button>
        <button id="btnColumn3" className="bg-gray-300 p-2">
          Column 3
        </button>
      </div>
    </>
  );
};

export default ExamplesContainer;
