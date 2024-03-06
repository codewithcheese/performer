import { FC, memo } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  oneLight,
  oneDark,
} from "react-syntax-highlighter/dist/cjs/styles/prism";
import { useCopyToClipboard } from "../hooks/use-copy-to-clipboard.js";
import { DownloadIcon } from "./icons/DownloadIcon.js";
import { CheckIcon } from "./icons/CheckIcon.js";
import { ClipboardIcon } from "./icons/ClipboardIcon.js";

interface MessageCodeBlockProps {
  language: string;
  value: string;
}

interface languageMap {
  [key: string]: string | undefined;
}

export const programmingLanguages: languageMap = {
  javascript: ".js",
  python: ".py",
  java: ".java",
  c: ".c",
  cpp: ".cpp",
  "c++": ".cpp",
  "c#": ".cs",
  ruby: ".rb",
  php: ".php",
  swift: ".swift",
  "objective-c": ".m",
  kotlin: ".kt",
  typescript: ".ts",
  go: ".go",
  perl: ".pl",
  rust: ".rs",
  scala: ".scala",
  haskell: ".hs",
  lua: ".lua",
  shell: ".sh",
  sql: ".sql",
  html: ".html",
  css: ".css",
};

export const generateRandomString = (length: number, lowercase = false) => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXY3456789"; // excluding similar looking characters like Z, 2, I, 1, O, 0
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return lowercase ? result.toLowerCase() : result;
};

export const MessageCodeBlock: FC<MessageCodeBlockProps> = memo(
  ({ language, value }) => {
    const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 2000 });

    const downloadAsFile = () => {
      if (typeof window === "undefined") {
        return;
      }
      const fileExtension = programmingLanguages[language] || ".file";
      const suggestedFileName = `file-${generateRandomString(
        3,
        true,
      )}${fileExtension}`;
      const fileName = window.prompt(
        "Enter file name" || "",
        suggestedFileName,
      );

      if (!fileName) {
        return;
      }

      const blob = new Blob([value], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = fileName;
      link.href = url;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    };

    const onCopy = () => {
      if (isCopied) return;
      copyToClipboard(value);
    };

    return (
      <div className="dark bg-gray-950 rounded-md overflow-hidden">
        <div className="flex w-full items-center justify-between bg-zinc-700 px-4 text-gray-300">
          <span className="text-xs lowercase">{language}</span>
          <div className="flex items-center space-x-1">
            <button className="btn relative" onClick={downloadAsFile}>
              <div className="flex w-full gap-2 items-center justify-center">
                <DownloadIcon />
              </div>
            </button>

            <button className="btn relative" onClick={onCopy}>
              <div className="flex w-full gap-2 items-center justify-center">
                {isCopied ? <CheckIcon /> : <ClipboardIcon />}
              </div>
            </button>
          </div>
        </div>
        <SyntaxHighlighter
          language={language}
          style={oneDark}
          // showLineNumbers
          customStyle={{
            margin: 0,
            width: "100%",
            background: "transparent",
          }}
          codeTagProps={{
            style: {
              fontSize: "14px",
              fontFamily: "var(--font-mono)",
            },
          }}
        >
          {value}
        </SyntaxHighlighter>
      </div>
    );
  },
);

MessageCodeBlock.displayName = "MessageCodeBlock";
