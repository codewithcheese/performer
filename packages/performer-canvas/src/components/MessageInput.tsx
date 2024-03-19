import {
  forwardRef,
  KeyboardEventHandler,
  useEffect,
  useRef,
  useState,
} from "react";
import { ArrowUp, MessageSquarePlus, SendIcon } from "lucide-react";

export type MessageInputProps = {
  disclaimer?: string;
  disabled?: boolean;
  onSubmit: (text: string) => void;
  onAddMessage: () => void;
  placeholder?: string;
};

export const MessageInput = forwardRef(function (
  {
    disclaimer,
    disabled = false,
    onSubmit,
    onAddMessage,
    placeholder,
  }: MessageInputProps,
  ref,
) {
  const [text, setText] = useState("");
  const textAreaRef = useRef<HTMLTextAreaElement>(ref as any);
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
    <div className="flex flex-row w-full nodrag">
      <div className="flex justify-center items-center">
        <button
          onClick={onAddMessage}
          className="p-2 rounded-lg border border-gray-200 text-white transition-colors enabled:bg-white disabled:bg-gray-200 disabled:text-gray-400 disabled:opacity-10"
        >
          <MessageSquarePlus className="text-black" />
        </button>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(text);
          setText("");
        }}
        className="stretch mx-2 flex flex-row flex-1 gap-3 nodrag"
      >
        <div className="relative flex flex-col h-full flex-1 items-stretch">
          <div className="flex w-full items-center">
            <div className="[&:has(textarea:focus)]:border-token-border-xheavy dark:border-token-border-heavy border-token-border-heavy relative flex w-full flex-grow flex-col overflow-hidden rounded-2xl border bg-white shadow-[0_0_0_2px_rgba(255,255,255,0.95)] dark:bg-gray-800 dark:text-white dark:shadow-[0_0_0_2px_rgba(52,53,65,0.95)] [&:has(textarea:focus)]:shadow-[0_2px_6px_rgba(0,0,0,.05)]">
              <textarea
                id="prompt-textarea"
                tabIndex={0}
                data-id="root"
                rows={1}
                placeholder={placeholder || "Message Performer…"}
                className="w-full p-4 resize-none border-0 bg-transparent placeholder-black/50 focus:outline-0 focus:ring-0 focus-visible:ring-0"
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
                <ArrowUp />
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
    </div>
  );
});
