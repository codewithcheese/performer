import { toTitleCase } from "../lib/message.js";
import { MessageMarkdown } from "./MessageMarkdown.js";
import { PerformerMessage, readTextContent } from "@performer/core";
import { MessageAvatar } from "./MessageAvatar.js";
import { ToolInfo } from "./ToolInfo.js";

export type MessageProps = {
  message: PerformerMessage;
};

export function Message({ message }: MessageProps) {
  return (
    <div
      className="text-token-text-primary w-full"
      data-testid="conversation-turn-2"
    >
      <div className="m-auto justify-center px-4 py-2 text-base md:gap-6">
        <div className="group mx-auto flex flex-1 gap-3 text-base md:max-w-3xl md:px-5 lg:max-w-[40rem] lg:px-1 xl:max-w-[48rem] xl:px-5">
          <div className="relative flex flex-shrink-0 flex-col items-end">
            <div>
              <div className="pt-0.5">
                <div className="gizmo-shadow-stroke flex h-6 w-6 items-center justify-center overflow-hidden rounded-full">
                  <div className="relative flex">
                    <MessageAvatar message={message} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="relative flex w-full flex-col lg:w-[calc(100%-115px)]">
            <div className="select-none font-semibold">
              {toTitleCase(message.role)}
            </div>
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
