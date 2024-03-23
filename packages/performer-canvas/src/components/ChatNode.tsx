import { useCallback, useEffect, useRef } from "react";
import { memo } from "react-tracked";
import { NodeProps, XYPosition } from "reactflow";
import { MessageInput } from "./MessageInput.tsx";
import { TitleBar } from "./TitleBar.tsx";
import { GripHorizontal, MinusIcon, X } from "lucide-react";
import {
  Assistant,
  concatDelta,
  findNodeByUid,
  flagAsDeleted,
  flagAsEdited,
  PerformerDeltaEvent,
  PerformerMessage,
  PerformerMessageEvent,
  pushElement,
} from "@performer/core";
import Message from "./Message.tsx";
import { ChatNodeData, deleteNode, getNode, newChatNode } from "../store.ts";
import { cn } from "../lib/cn.ts";
import { jsx } from "@performer/core/jsx-runtime";

export default memo(
  function ChatNode({ id, data }: NodeProps<ChatNodeData>) {
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const performer = data.performer;

    console.log("ChatNode render", id, data);

    useEffect(() => {
      // start performer on mount
      performer.start();
      performer.addEventListener("*", (event) => {
        const node = getNode(id)!;
        // handle performer event
        if (event.type === "delta") {
          const prevEvent = node.data.events.find(
            (e): e is PerformerDeltaEvent =>
              e.type === "delta" && e.detail.uid === event.detail.uid,
          );
          if (prevEvent) {
            concatDelta(prevEvent.detail.delta, event.detail.delta);
          } else {
            node.data.events.push(event);
          }
        } else if (event.type === "message") {
          const prevEvent = node.data.events.find(
            (e) =>
              (e.type === "delta" || e.type === "message") &&
              e.detail.uid === event.detail.uid,
          );
          if (!prevEvent) {
            node.data.events.push(event);
          }
        } else {
          node.data.events.push(event);
        }
      });
      return () => {
        // abort performer if still running
        if (performer.state === "running") {
          performer.abort();
        }
      };
    }, []);

    const onSubmit = useCallback(
      async (text?: string) => {
        if (performer.state !== "settled") {
          // submit when not settled is considered a cancel
          performer.abort();
          return;
        }

        if (performer.inputNode) {
          // if performer is listening
          if (text) {
            // input user message
            performer.input({ role: "user", content: text });
          } else {
            // not yet supported
            throw Error("Performer expects new message");
          }
        } else {
          // if not listening
          if (text) {
            // insert user message and Assistant
            pushElement(
              performer.root!,
              jsx("user", { role: "user", content: text }),
            );
          }
          // insert Assistant
          pushElement(performer.root!, jsx(Assistant, {}));
        }
        performer.start();
      },
      [id],
    );

    const handleChange = useCallback(
      (uid: string, edits: Partial<PerformerMessage>) => {
        const performerNode = findNodeByUid(performer.root!, uid);
        if (!performerNode) {
          throw Error(`Failed to update message. Message #${uid} not found.`);
        }
        flagAsEdited(performerNode, edits);
        // edit event history
        const node = getNode(id)!;
        const event = node.data.events.find(
          (e): e is PerformerDeltaEvent | PerformerMessageEvent =>
            (e.type === "message" || e.type === "delta") &&
            e.detail.uid === uid,
        );
        if (event && event.type === "message") {
          event.detail.message = Object.assign(event.detail.message, edits);
        } else if (event && event.type === "delta") {
          event.detail.delta = Object.assign(event.detail.delta, edits);
        }
      },
      [id],
    );

    const handleRemove = useCallback(
      (uid: string) => {
        const performerNode = findNodeByUid(performer.root!, uid);
        if (!performerNode) {
          throw Error(`Failed to remove message. Message #${uid} not found.`);
        }
        flagAsDeleted(performerNode);
        // delete event history
        const node = getNode(id)!;
        const eventIndex = node.data.events.findIndex(
          (e) =>
            (e.type === "message" || e.type === "delta") &&
            e.detail.uid === uid,
        );
        if (eventIndex > -1) {
          node.data.events.splice(eventIndex, 1);
        }
      },
      [id],
    );

    const handleCopy = useCallback(
      (uid: string, position: XYPosition) => {
        // get change messages instead of using props
        // so this callback is not invalidated during message streaming
        const node = getNode(id)!;
        newChatNode({
          position,
          zIndex: node.zIndex ? node.zIndex + 1 : 1000,
        });
      },
      [id],
    );

    const handleAddMessage = useCallback(() => {
      // todo how to handle when listening
      pushElement(performer.root!, jsx("user", { role: "user", content: "" }));
    }, [id]);

    const toggleHeadless = useCallback(() => {
      const node = getNode(id)!;
      node.data.headless = !data.headless;
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
            {data.events.map((event, index) => {
              if (event.type === "message" || event.type === "delta") {
                return (
                  <div key={`message-${index}`}>
                    <Message
                      isGenerating={
                        performer.state === "running" &&
                        index === data.events.length - 1
                      }
                      uid={event.detail.uid}
                      message={
                        event.type === "message"
                          ? event.detail.message
                          : (event.detail.delta as PerformerMessage)
                      }
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
                );
              }
              return null;
            })}
          </>
          {data.headless ? (
            <div className="flex flex-row justify-center items-center text-gray-500 nodrag ">
              <MinusIcon size={16} onClick={toggleHeadless} />
            </div>
          ) : (
            <>
              <div className="px-4">
                <MessageInput
                  isGenerating={performer.state === "running"}
                  ref={inputRef}
                  onSubmit={onSubmit}
                  onAddMessage={handleAddMessage}
                  placeholder="Enter a message..."
                />
              </div>
              <div className="flex flex-row justify-center items-center text-gray-500 nodrag">
                <MinusIcon size={16} onClick={toggleHeadless} />
              </div>
            </>
          )}
        </div>
      </>
    );
  },
  (prevProps, nextProps) => {
    // console.log("ChatNode memo", nextProps);
    // console.log(
    //   "ChatNode memo",
    //   prevProps.id === nextProps.id && prevProps.data === nextProps.data,
    // );
    return prevProps.id === nextProps.id && prevProps.data === nextProps.data;
  },
);
