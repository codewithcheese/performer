import { Divider, Message } from "./index.js";
import { Alert } from "./Alert.js";
import {
  PerformerEvent,
  PerformerMessageEvent,
  PerformerDeltaEvent,
  PerformerLifecycleEvent,
  PerformerErrorEvent,
} from "@performer/core";

type FilterType = "chat" | "all";

type MessageListProps = {
  events: PerformerEvent[];
  filter: FilterType;
};

function exclude(filter: FilterType, event: PerformerEvent) {
  return (
    // exclude system messages from chat view
    (filter === "chat" &&
      event instanceof PerformerMessageEvent &&
      event.detail.message.role === "system") ||
    // exclude messages with no content from chat view
    (filter === "chat" &&
      event instanceof PerformerMessageEvent &&
      !event.detail.message.content) ||
    // exclude delta with no content from chat view
    (filter === "chat" &&
      event instanceof PerformerDeltaEvent &&
      !event.detail.delta.content) ||
    // exclude non-root threads from chat view
    (filter === "chat" && event.threadId != "root")
  );
}

function getRole(event: PerformerEvent) {
  if (event instanceof PerformerMessageEvent) {
    return event.detail.message.role;
  } else if (event instanceof PerformerDeltaEvent) {
    return event.detail.delta.role;
  } else {
    return undefined;
  }
}

function map(filter: FilterType, events: PerformerEvent[]) {
  let prevEvent;
  let continuation = false;
  const items = [];
  for (const [index, event] of events.entries()) {
    if (exclude(filter, event)) {
      continue;
    }
    if (
      prevEvent &&
      prevEvent instanceof PerformerMessageEvent &&
      prevEvent.detail.message.role === "user"
    ) {
      continuation = false;
    } else if (prevEvent && getRole(prevEvent) !== getRole(event)) {
      continuation = false;
    } else if (!prevEvent) {
      continuation = false;
    } else {
      continuation = true;
    }
    if (event instanceof PerformerMessageEvent) {
      items.push(
        <Message
          key={index}
          message={event.detail.message}
          continuation={continuation}
        />,
      );
    } else if (event instanceof PerformerDeltaEvent) {
      items.push(
        <Message
          key={index}
          message={
            event.detail.delta as {
              role: "assistant";
              content: string;
            }
          }
          continuation={continuation}
        />,
      );
    } else if (event instanceof PerformerLifecycleEvent) {
      items.push(
        <Divider key={index} message={`Performer ${event.detail.state}`} />,
      );
    } else if (event instanceof PerformerErrorEvent) {
      items.push(
        <div className="group mx-auto flex flex-1 gap-3 text-base md:max-w-3xl md:px-5 lg:max-w-[40rem] lg:px-1 xl:max-w-[48rem] xl:px-5">
          <Alert key={index} title="Error" message={event.detail.message} />
        </div>,
      );
    }
    prevEvent = event;
  }
  return items;
}

export function MessageList({ events, filter }: MessageListProps) {
  return <>{map(filter, events)}</>;
}
