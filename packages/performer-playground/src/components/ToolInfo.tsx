import { useState } from "react";

export function ToolInfo() {
  const [show] = useState(false);
  return (
    show && (
      <div className="flex flex-col items-start">
        <div className="flex items-center rounded bg-gray-100 p-3 text-xs text-gray-900">
          <div>
            <div className="flex items-center gap-3">
              <div>
                Used <b>AI Diagrams</b>
              </div>
            </div>
          </div>
          <div className="ml-12 flex items-center gap-2" role="button">
            <svg
              stroke="currentColor"
              fill="none"
              strokeWidth="2"
              viewBox="0 0 24 24"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="icon-sm"
              height="1em"
              width="1em"
              xmlns="http://www.w3.org/2000/svg"
            >
              <polyline points="18 15 12 9 6 15"></polyline>
            </svg>
          </div>
        </div>
        <div className="my-3 flex max-w-full flex-col gap-3">
          <div className="w-full rounded-md bg-black text-xs text-white/80">
            <div className="dark:bg-token-surface-primary relative flex items-center justify-between rounded-t-md bg-gray-800 px-4 py-2 font-sans text-xs text-gray-200">
              <span>
                <span className="uppercase">Request to AI Diagrams</span>
              </span>
              <span className="" data-state="closed">
                <svg
                  stroke="currentColor"
                  fill="none"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="icon-sm text-white/50"
                  height="1em"
                  width="1em"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
              </span>
            </div>
            <div className="overflow-y-auto p-4">
              <code className="!whitespace-pre-wrap"></code>
            </div>
          </div>
          <div className="w-full rounded-md bg-black text-xs text-white/80">
            <div className="dark:bg-token-surface-primary relative flex items-center justify-between rounded-t-md bg-gray-800 px-4 py-2 font-sans text-xs text-gray-200">
              <span>
                <span className="uppercase">Response from AI Diagrams</span>
              </span>
              <span className="" data-state="closed">
                <svg
                  stroke="currentColor"
                  fill="none"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="icon-sm text-white/50"
                  height="1em"
                  width="1em"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
              </span>
            </div>
            <div className="overflow-y-auto p-4">
              <code className="!whitespace-pre-wrap">
                <span className=""></span>
              </code>
            </div>
          </div>
        </div>
      </div>
    )
  );
}
