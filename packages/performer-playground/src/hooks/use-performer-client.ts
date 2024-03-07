import { useEffect, useState } from "react";
import {
  Component,
  concatDelta,
  Performer,
  PerformerDeltaEvent,
  PerformerEvent,
} from "@performer/core";
import { jsx } from "@performer/core/jsx-runtime";

export function usePerformerClient(app: Component<any> | null) {
  const [events, setEvents] = useState<PerformerEvent[]>([]);
  const [performer, setPerformer] = useState<Performer | null>(null);

  function sendMessage(text: string) {
    if (!performer) {
      return;
    }
    performer.input({ role: "user", content: [{ type: "text", text }] });
  }

  useEffect(() => {
    if (!app) {
      return;
    }
    try {
      setEvents([]);
      const performer = new Performer(jsx(app, {}));
      setPerformer(performer);

      performer.addEventListener("*", (event) => {
        if (!(event instanceof PerformerDeltaEvent)) {
          return setEvents((prevEvents) => [...prevEvents, event]);
        }
        setEvents((prevEvents) => {
          const previous = prevEvents.findLast(
            (prev): prev is PerformerDeltaEvent =>
              prev instanceof PerformerDeltaEvent &&
              prev.detail.uid === event.detail.uid,
          );
          if (!previous) {
            return [...prevEvents, event];
          }
          concatDelta(previous.detail.delta, event.detail.delta);
          return prevEvents.toSpliced(prevEvents.length - 1, 1, previous);
        });
      });
      performer.start();
    } catch (e) {
      console.error("Performer exception", e);
    }
  }, [app]);

  return { events, sendMessage };
}
