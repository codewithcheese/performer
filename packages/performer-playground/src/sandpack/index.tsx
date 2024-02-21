import { files } from "./files.js";
import { Sandpack, SandpackProps } from "@codesandbox/sandpack-react";

export { files };

export function PerformerSandpack(props: SandpackProps) {
  return (
    <Sandpack
      options={{
        bundlerTimeOut: 90000,
        // fixme: new bundler throws, not sure why
        // bundlerURL: "https://sandpack-bundler.pages.dev",
        externalResources: [
          "https://cdn.tailwindcss.com",
          "https://rsms.me/inter/inter.css",
        ],
      }}
      template={"react"}
      files={files}
      theme="auto"
      {...props}
    />
  );
}
