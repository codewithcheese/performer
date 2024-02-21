import React from "react";
import { TableOfContents } from "./TableOfContents";
import {
  SandpackCodeEditor,
  SandpackPreview,
  SandpackProvider,
} from "@codesandbox/sandpack-react";

const sections = [
  {
    title: "Introduction",
    examples: [
      {
        slug: "messages",
        title: "Messages",
      },
      {
        slug: "elements",
        title: "Elements",
      },
    ],
  },
  {
    title: "Components",
    examples: [
      {
        slug: "assistant",
        title: "Assistant",
      },
      {
        slug: "user",
        title: "User",
      },
    ],
  },
];

const ExamplesContainer = ({ data }) => {
  return (
    <>
      <div className="h-full flex flex-col md:flex-row">
        <div className="w-full md:w-[36ch] md:border-r md:border-gray-200">
          <TableOfContents activeSection="messages" isLoading={false} />
        </div>

        <SandpackProvider
          options={{
            classes: {
              "sp-wrapper": "examples-sp-wrapper",
              "sp-stack": "examples-sp-stack",
              "sp-tab-button": "examples-sp-tab",
            },
          }}
          template="react"
        >
          <div className="flex flex-col flex-1 lg:flex-row">
            <div className="w-full lg:flex-1 bg-green-200 md:border-r md:border-gray-200">
              <SandpackCodeEditor />
            </div>
            <div className="w-full lg:flex-1 bg-blue-200 md:border-r md:border-gray-200">
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
