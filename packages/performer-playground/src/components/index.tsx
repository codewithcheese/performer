import { useState } from "react";
import { PerformerMessage, readTextContent } from "@performer/core";
import { toTitleCase } from "../lib/message.js";
import { MessageMarkdown } from "./MessageMarkdown.js";

export function Divider({ message }: { message: string }) {
  return (
    <div className="flex items-center">
      <div className="border-token-border-secondary flex-grow border-b"></div>
      <div className="text-token-text-tertiary flex flex-shrink-0 items-center gap-2 px-2 py-6 text-sm">
        <svg
          stroke="currentColor"
          fill="none"
          strokeWidth="2"
          viewBox="0 0 24 24"
          strokeLinecap="round"
          strokeLinejoin="round"
          height="1em"
          width="1em"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
        </svg>
        {message}
      </div>
      <div className="border-token-border-secondary flex-grow border-b"></div>
    </div>
  );
}

export function Suggestion() {
  return (
    <span data-projection-id="4">
      <button className="btn btn-neutral group relative w-full whitespace-nowrap rounded-xl px-4 py-3 text-left text-gray-700 dark:text-gray-300 md:whitespace-normal">
        <div className="flex w-full items-center justify-center gap-2">
          <div className="flex w-full items-center justify-between">
            <div className="flex flex-col overflow-hidden">
              <div className="truncate">Recommend a dish</div>
              <div className="truncate font-normal opacity-50">
                to impress a date who's a picky eater
              </div>
            </div>
            <div className="absolute bottom-0 right-0 top-0 flex items-center rounded-xl bg-gradient-to-l from-gray-50 from-[60%] pl-6 pr-4 text-gray-700 opacity-0 group-hover:opacity-100 dark:from-gray-700 dark:text-gray-200">
              <span className="" data-state="closed">
                <div className="bg-token-surface-primary shadow-xxs rounded-lg p-1 dark:shadow-none">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="icon-sm text-token-text-primary"
                  >
                    <path
                      d="M7 11L12 6L17 11M12 18V7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></path>
                  </svg>
                </div>
              </span>
            </div>
          </div>
        </div>
      </button>
    </span>
  );
}

export function Suggestions() {
  return (
    <div>
      <div className="ml-1 flex h-full justify-center gap-0 md:m-auto md:mb-4 md:w-full md:gap-2">
        <div className="grow">
          <div className="absolute bottom-full left-0 mb-4 flex w-full grow gap-2 px-1 pb-1 sm:px-2 sm:pb-0 md:static md:mb-0 md:max-w-none">
            <div className="grid w-full grid-flow-row grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-2">
              <div className="flex flex-col gap-2">
                <span data-projection-id="5">
                  <button className="btn btn-neutral group relative w-full whitespace-nowrap rounded-xl px-4 py-3 text-left text-gray-700 dark:text-gray-300 md:whitespace-normal">
                    <div className="flex w-full items-center justify-center gap-2">
                      <div className="flex w-full items-center justify-between">
                        <div className="flex flex-col overflow-hidden">
                          <div className="truncate">Suggest some names</div>
                          <div className="truncate font-normal opacity-50">
                            for my cafe-by-day, bar-by-night business
                          </div>
                        </div>
                        <div className="absolute bottom-0 right-0 top-0 flex items-center rounded-xl bg-gradient-to-l from-gray-50 from-[60%] pl-6 pr-4 text-gray-700 opacity-0 group-hover:opacity-100 dark:from-gray-700 dark:text-gray-200">
                          <span className="" data-state="closed">
                            <div className="bg-token-surface-primary shadow-xxs rounded-lg p-1 dark:shadow-none">
                              <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                className="icon-sm text-token-text-primary"
                              >
                                <path
                                  d="M7 11L12 6L17 11M12 18V7"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                ></path>
                              </svg>
                            </div>
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <span data-projection-id="6">
                  <button className="btn btn-neutral group relative w-full whitespace-nowrap rounded-xl px-4 py-3 text-left text-gray-700 dark:text-gray-300 md:whitespace-normal">
                    <div className="flex w-full items-center justify-center gap-2">
                      <div className="flex w-full items-center justify-between">
                        <div className="flex flex-col overflow-hidden">
                          <div className="truncate">Come up with concepts</div>
                          <div className="truncate font-normal opacity-50">
                            for a retro-style arcade game
                          </div>
                        </div>
                        <div className="absolute bottom-0 right-0 top-0 flex items-center rounded-xl bg-gradient-to-l from-gray-50 from-[60%] pl-6 pr-4 text-gray-700 opacity-0 group-hover:opacity-100 dark:from-gray-700 dark:text-gray-200">
                          <span className="" data-state="closed">
                            <div className="bg-token-surface-primary shadow-xxs rounded-lg p-1 dark:shadow-none">
                              <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                className="icon-sm text-token-text-primary"
                              >
                                <path
                                  d="M7 11L12 6L17 11M12 18V7"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                ></path>
                              </svg>
                            </div>
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                </span>
                <span data-projection-id="7">
                  <button className="btn btn-neutral group relative w-full whitespace-nowrap rounded-xl px-4 py-3 text-left text-gray-700 dark:text-gray-300 md:whitespace-normal">
                    <div className="flex w-full items-center justify-center gap-2">
                      <div className="flex w-full items-center justify-between">
                        <div className="flex flex-col overflow-hidden">
                          <div className="truncate">Show me a code snippet</div>
                          <div className="truncate font-normal opacity-50">
                            of a website's sticky header
                          </div>
                        </div>
                        <div className="absolute bottom-0 right-0 top-0 flex items-center rounded-xl bg-gradient-to-l from-gray-50 from-[60%] pl-6 pr-4 text-gray-700 opacity-0 group-hover:opacity-100 dark:from-gray-700 dark:text-gray-200">
                          <span className="" data-state="closed">
                            <div className="bg-token-surface-primary shadow-xxs rounded-lg p-1 dark:shadow-none">
                              <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                className="icon-sm text-token-text-primary"
                              >
                                <path
                                  d="M7 11L12 6L17 11M12 18V7"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                ></path>
                              </svg>
                            </div>
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ModelSelect() {
  const [show] = useState(false);
  return (
    show && (
      <div className="sticky top-0 z-10 mb-1.5 flex h-14 items-center justify-between bg-white p-2 font-semibold dark:bg-gray-800">
        <div className="absolute left-1/2 -translate-x-1/2"></div>
        <div className="flex items-center gap-2">
          <div
            className="radix-state-open:bg-gray-50 dark:radix-state-open:bg-black/20 group flex cursor-pointer items-center gap-1 rounded-xl px-3 py-2 text-lg font-medium hover:bg-gray-50 dark:hover:bg-black/10"
            id="radix-:rh:"
            aria-haspopup="menu"
            aria-expanded="false"
            data-state="closed"
          >
            <div>
              Model <span className="text-token-text-secondary">version</span>
            </div>
            <svg
              width="16"
              height="17"
              viewBox="0 0 16 17"
              fill="none"
              className="text-token-text-tertiary"
            >
              <path
                d="M11.3346 7.83203L8.00131 11.1654L4.66797 7.83203"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
            </svg>
          </div>
        </div>
        <div className="flex gap-2 pr-1"></div>
      </div>
    )
  );
}

export function Splash() {
  const [show] = useState(false);
  return (
    show && (
      <div className="flex h-full flex-col items-center justify-center">
        <div className="relative">
          <div className="mb-3 h-[72px] w-[72px]">
            <div className="gizmo-shadow-stroke relative flex h-full items-center justify-center rounded-full bg-white text-black">
              Performer
            </div>
          </div>
        </div>
      </div>
    )
  );
}

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

export type MessageProps = {
  message: PerformerMessage;
  continuation: boolean;
};

export function MessageIcon({ role }: { role: string }) {
  switch (role) {
    case "user":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-6 w-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
          />
        </svg>
      );
    case "assistant":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-6 w-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
          />
        </svg>
      );
    case "system":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-6 w-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 0 0 2.25-2.25V6.75a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 6.75v10.5a2.25 2.25 0 0 0 2.25 2.25Zm.75-12h9v9h-9v-9Z"
          />
        </svg>
      );
  }
}

export function Message({ message, continuation }: MessageProps) {
  return (
    <div
      className="text-token-text-primary w-full"
      data-testid="conversation-turn-2"
    >
      <div className="m-auto justify-center px-4 py-2 text-base md:gap-6">
        <div className="group mx-auto flex flex-1 gap-3 text-base md:max-w-3xl md:px-5 lg:max-w-[40rem] lg:px-1 xl:max-w-[48rem] xl:px-5">
          <div className="relative flex flex-shrink-0 flex-col items-end">
            <div>
              <div className="pt-0.5 h-6 w-6">
                {!continuation && (
                  <div className="gizmo-shadow-stroke flex  items-center justify-center overflow-hidden rounded-full">
                    <div className="relative flex">
                      <MessageIcon role={message.role} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="relative flex w-full flex-col lg:w-[calc(100%-115px)]">
            {!continuation && (
              <div className="select-none font-semibold">
                {toTitleCase(message.role)}
              </div>
            )}
            <div className="flex-col gap-1 md:gap-3">
              <div className="flex max-w-full flex-grow flex-col">
                <ToolInfo />
                {message.role !== "tool" && message.content && (
                  <div
                    data-message-author-role={message.role}
                    className="text-message flex min-h-[20px] flex-col items-start gap-3 overflow-x-auto whitespace-pre-wrap break-words [.text-message+&]:mt-5"
                  >
                    <MessageMarkdown content={readTextContent(message)} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
