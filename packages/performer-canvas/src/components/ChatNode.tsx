import { useCallback, useRef, useState } from "react";
import { memo } from "react-tracked";
import { NodeProps, XYPosition } from "reactflow";
import { MessageInput } from "./MessageInput.tsx";
import { TitleBar } from "./TitleBar.tsx";
import { GripHorizontal, MinusIcon, X } from "lucide-react";
import {
  AssistantMessage,
  PerformerMessage,
  UserMessage,
} from "@performer/core";
import Message from "./Message.tsx";
import OpenAI from "openai";
import {
  deleteNode,
  getChatMessages,
  newNode,
  pushChatMessage,
  removeChatMessage,
  updateChatMessage,
} from "../store.ts";
import { cn } from "../lib/cn.ts";

type ChatNodeData = {
  messages: PerformerMessage[];
  headless: boolean;
  dropIndex: number;
};

type ChatState =
  | { type: "idle" }
  | { type: "generating"; index: number; controller: AbortController };

export default memo(
  function ChatNode({ id, data }: NodeProps<ChatNodeData>) {
    // console.log("ChatNode render", id, data);
    const [chatState, setChatState] = useState<ChatState>({ type: "idle" });
    const [isHeadless, setIsHeadless] = useState<boolean>(data.headless);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const onSubmit = useCallback(
      async (text?: string) => {
        if (chatState.type === "generating") {
          // submit when generating is considered a cancel
          chatState.controller.abort();
          setChatState({ type: "idle" });
          return;
        }

        if (text) {
          const userMessage: UserMessage = { role: "user", content: text };
          pushChatMessage(id, userMessage);
        }

        try {
          const controller = new AbortController();
          // add assistant message
          const message: AssistantMessage = {
            role: "assistant",
            content: "",
          };
          const index = pushChatMessage(id, message);
          setChatState({ type: "generating", controller, index });

          // create completion
          const openai = new OpenAI({
            dangerouslyAllowBrowser: true,
          });
          const messages = getChatMessages(id);
          console.log("messages", messages);
          const stream = await openai.chat.completions.create(
            {
              model: "gpt-4-turbo-preview",
              messages,
              stream: true,
            },
            { signal: controller.signal },
          );

          // consume completion, update node
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta;
            if ("content" in delta) {
              if (message.content == null) {
                message.content = "";
              }
              message.content += delta.content;
              updateChatMessage(id, index, message);
            }
          }
          inputRef.current?.focus();
        } finally {
          setChatState({ type: "idle" });
        }
      },
      [id, chatState],
    );

    const handleChange = useCallback(
      (index: number, message: Partial<PerformerMessage>) => {
        updateChatMessage(id, index, message);
      },
      [id],
    );

    const handleRemove = useCallback(
      (index: number) => {
        removeChatMessage(id, index);
      },
      [id],
    );

    const handleCopy = useCallback(
      (index: number, position: XYPosition) => {
        // get change messages instead of using `data` dep
        // so that this callback is not invalidated during message streaming
        const messages = getChatMessages(id);
        newNode({
          type: "chatNode",
          data: { messages: [messages[index]], headless: true },
          position,
        });
      },
      [id],
    );

    const handleAddMessage = useCallback(() => {
      pushChatMessage(id, { role: "user", content: "" });
    }, [id]);

    return (
      <>
        <div className="bg-white rounded shadow border border-gray-200 w-[70ch]">
          <TitleBar>
            <GripHorizontal className="ml-2 text-gray-500" size={16} />
            <div className="flex-1"></div>
            <X
              className="text-gray-500 nodrag"
              size={16}
              onClick={() => deleteNode(id)}
            />
          </TitleBar>
          <>
            <div
              className={cn(
                "message-dropzone w-full",
                data.dropIndex === 0 && "border-blue-500 border border-dashed ",
              )}
              data-nodeid={id}
              data-index={0}
            />
            {data.messages.map((m, index) => (
              <div key={`message-${index}`}>
                <Message
                  isGenerating={
                    chatState.type === "generating" && chatState.index === index
                  }
                  index={index}
                  message={m}
                  onSubmit={onSubmit}
                  onRemove={handleRemove}
                  onChange={handleChange}
                  onCopy={handleCopy}
                />
                <div
                  className={cn(
                    "message-dropzone w-full",
                    data.dropIndex === index + 1 &&
                      "border-blue-500 border border-dashed ",
                  )}
                  data-nodeid={id}
                  data-index={index + 1}
                />
              </div>
            ))}
          </>
          {isHeadless ? (
            <div className="flex flex-row justify-center items-center text-gray-500 nodrag ">
              <MinusIcon size={16} onClick={() => setIsHeadless((p) => !p)} />
            </div>
          ) : (
            <>
              <div className="px-4">
                <MessageInput
                  isGenerating={chatState.type === "generating"}
                  ref={inputRef}
                  onSubmit={onSubmit}
                  onAddMessage={handleAddMessage}
                  placeholder="Enter a message..."
                />
              </div>
              <div className="flex flex-row justify-center items-center text-gray-500 nodrag">
                <MinusIcon size={16} onClick={() => setIsHeadless((p) => !p)} />
              </div>
            </>
          )}
        </div>
      </>
    );
  },
  (prevProps, nextProps) => {
    // console.log(
    //   "ChatNode memo",
    //   prevProps.id === nextProps.id && prevProps.data === nextProps.data,
    // );
    return prevProps.id === nextProps.id && prevProps.data === nextProps.data;
  },
);
