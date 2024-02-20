import { KeyboardEventHandler, useEffect, useRef, useState } from "react";

export type MessageInputProps = {
  disclaimer?: string;
  disabled?: boolean;
  onSubmit: (text: string) => void;
};

export function MessageInput({
  disclaimer,
  disabled = false,
  onSubmit,
}: MessageInputProps) {
  const [text, setText] = useState("");
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const hiddenDivRef = useRef<HTMLDivElement>(null);
  const submitBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (hiddenDivRef.current && textAreaRef.current) {
      hiddenDivRef.current.innerHTML = text.replace(/\n/g, "<br/>") + "<br/>";
      textAreaRef.current.style.height = `${hiddenDivRef.current.offsetHeight}px`;
    }
  }, [text]);

  const handleChange = (e: any) => {
    setText(e.target.value);
  };

  const handleKeyPress: KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey) {
      e.preventDefault();
      submitBtnRef.current?.click();
      setText("");
    }
  };

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(text);
        }}
        className="stretch mx-2 flex flex-row gap-3 last:mb-2 md:mx-4 md:last:mb-6 lg:mx-auto lg:max-w-2xl xl:max-w-3xl"
      >
        <div className="relative flex h-full flex-1 items-stretch md:flex-col">
          <div className="flex w-full items-center">
            <div className="[&:has(textarea:focus)]:border-token-border-xheavy dark:border-token-border-heavy border-token-border-heavy relative flex w-full flex-grow flex-col overflow-hidden rounded-2xl border bg-white shadow-[0_0_0_2px_rgba(255,255,255,0.95)] dark:bg-gray-800 dark:text-white dark:shadow-[0_0_0_2px_rgba(52,53,65,0.95)] [&:has(textarea:focus)]:shadow-[0_2px_6px_rgba(0,0,0,.05)]">
              <textarea
                id="prompt-textarea"
                tabIndex={0}
                data-id="root"
                rows={1}
                placeholder="Message Performer…"
                className="m-0 w-full resize-none border-0 bg-transparent py-[10px] pl-3 pr-10 placeholder-black/50 focus:outline-0 focus:ring-0 focus-visible:ring-0 dark:bg-transparent dark:placeholder-white/50 md:py-3.5 md:pl-4 md:pr-12"
                ref={textAreaRef}
                value={text}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                style={{ overflowY: "auto" }}
              ></textarea>
              <button
                ref={submitBtnRef}
                disabled={disabled}
                className="absolute bottom-1.5 right-2 rounded-lg border border-black p-0.5 text-white transition-colors enabled:bg-black disabled:bg-black disabled:text-gray-400 disabled:opacity-10 dark:border-white dark:bg-white dark:hover:bg-gray-900 dark:disabled:bg-white dark:disabled:hover:bg-transparent md:bottom-3 md:right-3"
                data-testid="send-button"
              >
                <span className="" data-state="closed">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="text-white dark:text-black"
                  >
                    <path
                      d="M7 11L12 6L17 11M12 18V7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></path>
                  </svg>
                </span>
              </button>
            </div>
            <div
              className="py-[14px]" // Include only the padding classes that match the textarea
              ref={hiddenDivRef}
              style={{
                whiteSpace: "pre-wrap",
                visibility: "hidden",
                position: "absolute",
                minHeight: "52px",
                maxHeight: "200px",
              }}
            >
              {text}
            </div>
          </div>
        </div>
      </form>
      {disclaimer && (
        <div className="relative px-2 py-2 text-center text-xs text-gray-600 dark:text-gray-300 md:px-[60px]">
          <span>{disclaimer}</span>
        </div>
      )}
    </>
  );
}
