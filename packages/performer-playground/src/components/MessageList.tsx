import { Divider, Message } from "./index.js";
import { Alert } from "./Alert.js";
import {
  PerformerEvent,
  PerformerMessageEvent,
  PerformerDeltaEvent,
  PerformerLifecycleEvent,
  PerformerErrorEvent,
} from "@performer/core";

type MessageListProps = {
  events: PerformerEvent[];
  filter: "chat" | "all";
};

export function MessageList({ events, filter }: MessageListProps) {
  return (
    <>
      {events.map((event, index) => {
        if (event instanceof PerformerMessageEvent) {
          if (filter === "chat" && event.detail.message.role === "system") {
            return null;
          } else if (filter === "chat" && !event.detail.message.content) {
            return null;
          }
          return <Message key={index} message={event.detail.message} />;
        } else if (event instanceof PerformerDeltaEvent) {
          if (filter === "chat" && !event.detail.delta.content) {
            return null;
          }
          return (
            <Message
              key={index}
              message={
                event.detail.delta as {
                  role: "assistant";
                  content: string;
                }
              }
            />
          );
        } else if (event instanceof PerformerLifecycleEvent) {
          return (
            <Divider key={index} message={`Performer ${event.detail.state}`} />
          );
        } else if (event instanceof PerformerErrorEvent) {
          return (
            <div className="group mx-auto flex flex-1 gap-3 text-base md:max-w-3xl md:px-5 lg:max-w-[40rem] lg:px-1 xl:max-w-[48rem] xl:px-5">
              <Alert key={index} title="Error" message={event.detail.message} />
            </div>
          );
        }
      })}
    </>
  );
}
