import { useEffect, useState } from "react";
import {
  Component,
  isTextContent,
  Performer,
  PerformerEvent,
  PerformerMessage,
  PerformerDeltaEvent,
  PerformerMessageEvent,
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
      new PerformerMessageEvent({
        message: { role: "user", content: [{ type: "text", text }] },
      }),
    );
  }

  useEffect(() => {
    if (!app) {
      return;
    }
    try {
      const performer = new Performer({ element: jsx(app, {}) });
      setPerformer(performer);

      performer.addEventListener("*", (event) => {
        if (!(event instanceof PerformerDeltaEvent)) {
          return setEvents((prevEvents) => [...prevEvents, event]);
        }

        setEvents((prevEvents) => {
          const prevEvent = prevEvents.findLast(
            (event): event is PerformerMessageEvent | PerformerDeltaEvent =>
              (event instanceof PerformerMessageEvent ||
                event instanceof PerformerDeltaEvent) &&
              event.detail.uid === event.detail.uid,
          );
          if (!prevEvent) {
            return [...prevEvents, event];
          }

          // update content of previous message
          if (typeof event.detail.message.content === "string") {
            updateTextContent(
              event.detail.message.content,
              prevEvent.detail.message,
            );
          } else {
            for (const [_, content] of event.detail.message.content.entries()) {
              if (isTextContent(content)) {
                updateTextContent(content.text, prevEvent.detail.message);
              }
            }
          }
          return prevEvents.toSpliced(prevEvents.length - 1, 1, prevEvent);
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
