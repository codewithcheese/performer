import { files } from "./files.js";
import {
  SandpackCodeEditor,
  SandpackConsole,
  SandpackFileExplorer,
  SandpackLayout,
  SandpackPreview,
  SandpackProvider,
} from "@codesandbox/sandpack-react";

export type PerformerSandpackProps = {
  showFileExplorer?: boolean;
  showCodeEditor?: boolean;
  showConsole?: boolean;
  fileExplorerProps?: Record<string, any>;
  codeEditorProps?: Record<string, any>;
  previewProps?: Record<string, any>;
};

export function PerformerSandpack({
  showFileExplorer,
  showCodeEditor,
  showConsole,
  fileExplorerProps = {},
  codeEditorProps = {},
  previewProps = {},
}: PerformerSandpackProps) {
  return (
    <SandpackProvider
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
    >
      <SandpackLayout>
        {showFileExplorer && <SandpackFileExplorer {...fileExplorerProps} />}
        {showCodeEditor && <SandpackCodeEditor {...codeEditorProps} />}
        <SandpackPreview {...previewProps} />
      </SandpackLayout>
      {showConsole && (
        <>
          <br />
          <SandpackLayout>
            <SandpackConsole />
          </SandpackLayout>
        </>
      )}
    </SandpackProvider>
  );
}
