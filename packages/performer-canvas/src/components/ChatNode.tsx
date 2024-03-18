import { memo, useCallback, useState } from "react";
import { NodeProps, useReactFlow, XYPosition } from "reactflow";
import { MessageInput } from "./MessageInput.tsx";
import { TitleBar } from "./TitleBar.tsx";
import {
  ChevronDown,
  ChevronUp,
  ExpandIcon,
  GripHorizontal,
  Maximize,
  Minimize,
  Minimize2,
  MinusIcon,
  X,
} from "lucide-react";
import { useStore } from "../store.ts";
import {
  AssistantMessage,
  PerformerMessage,
  UserMessage,
} from "@performer/core";
import Message from "./Message.tsx";
import OpenAI from "openai";

type ChatNodeData = {
  messages: PerformerMessage[];
  headless: boolean;
};

export default memo(function ChatNode({ id, data }: NodeProps<ChatNodeData>) {
  // store methods
  const {
    newNode,
    deleteNode,
    updateChatMessage,
    removeChatMessage,
    insertChatMessage,
  } = useStore((state) => ({
    deleteNode: state.deleteNode,
    newNode: state.newNode,
    updateChatMessage: state.updateChatMessage,
    removeChatMessage: state.removeChatMessage,
    insertChatMessage: state.insertChatMessage,
  }));
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);
  const [isHeadless, setIsHeadless] = useState<boolean>(data.headless);

  const onSubmit = useCallback(
    async (text?: string) => {
      if (abortController) {
        console.error("Unable to submit message while response is generating");
        return;
      }

      const messages = data.messages;
      if (text) {
        const userMessage: UserMessage = { role: "user", content: text };
        insertChatMessage(id, userMessage);
        messages.push(userMessage);
      }

      // create completion
      try {
        const controller = new AbortController();
        setAbortController(controller);
        const openai = new OpenAI({
          dangerouslyAllowBrowser: true,
        });
        const stream = await openai.chat.completions.create(
          {
            model: "gpt-4-turbo-preview",
            messages,
            stream: true,
          },
          { signal: controller.signal },
        );

        // add message node
        const message: AssistantMessage = {
          role: "assistant",
          content: "",
        };
        const index = insertChatMessage(id, message);

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
      } finally {
        setAbortController(null);
      }
    },
    [id, data, abortController],
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
      const message = data.messages[index];
      newNode({
        type: "chatNode",
        data: { messages: [message], headless: true },
        position,
      });
    },
    [data],
  );

  console.log("ChatNode", id, data);

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
        <div>
          {data.messages.map((m, index) => (
            <Message
              key={index}
              index={index}
              message={m}
              onSubmit={onSubmit}
              onRemove={handleRemove}
              onChange={handleChange}
              onCopy={handleCopy}
            />
          ))}
        </div>
        {isHeadless ? (
          <div className="flex flex-row justify-center items-center text-gray-500 nodrag ">
            <MinusIcon size={16} onClick={() => setIsHeadless((p) => !p)} />
          </div>
        ) : (
          <>
            <div className="p-4 pt-0">
              <MessageInput
                onSubmit={onSubmit}
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
});
