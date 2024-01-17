import { useEffect, useState } from "react";
import {
  Component,
  createMessageEvent,
  isMessageEvent,
  isPerformerEvent,
  isTextContent,
  Performer,
  PerformerEvent,
  PerformerMessage,
} from "@performer/core";
import { jsx } from "@performer/core/jsx-runtime";

export function usePerformerClient(app: Component<any> | null) {
  const [events, setEvents] = useState<PerformerEvent[]>([]);
  const [performer, setPerformer] = useState<Performer | null>(null);

  function sendMessage(text: string) {
    if (!performer) {
      return;
    }
    performer.input(
      createMessageEvent({ role: "user", content: [{ type: "text", text }] }),
    );
  }

  useEffect(() => {
    if (!app) {
      return;
    }
    try {
      const performer = new Performer({ element: jsx(app, {}) });
      setPerformer(performer);
      performer.addEventHandler((event) => {
        console.log("Performer event", event);
        if (!isPerformerEvent(event)) {
          return console.error("Unexpected event object");
        }
        if (!isMessageEvent(event)) {
          return setEvents((prevEvents) => [...prevEvents, event]);
        }

        setEvents((prevEvents) => {
          const prevEvent = prevEvents.findLast(isMessageEvent);
          if (
            prevEvent &&
            event.op === "update" &&
            prevEvent.sid === event.sid
          ) {
            // update content of previous message
            if (typeof event.payload.content === "string") {
              updateTextContent(event.payload.content, prevEvent.payload);
            } else {
              for (const [_, content] of event.payload.content.entries()) {
                if (isTextContent(content)) {
                  updateTextContent(content.text, prevEvent.payload);
                }
              }
            }
            return prevEvents.toSpliced(prevEvents.length - 1, 1, prevEvent);
          } else if (
            prevEvents.length &&
            event.op === "close" &&
            prevEvent &&
            prevEvent.sid === event.sid
          ) {
            // skip "close" event when updates aggregated
            return prevEvents;
          } else {
            return [...prevEvents, event];
          }
        });
      });
      performer.start();
    } catch (e) {
      console.error("Performer exception", e);
    }
  }, [app]);

  return { events, sendMessage };
}

function updateTextContent(text: string, message: PerformerMessage) {
  if (typeof message.content === "string") {
    message.content += text;
  } else {
    const textContent = message.content.findLast(isTextContent);
    if (textContent) {
      textContent.text += text;
    } else {
      message.content.push({ type: "text", text });
    }
  }
}
