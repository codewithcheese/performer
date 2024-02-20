import { useEffect, useState } from "react";
import {
  Component,
  concatDelta,
  Performer,
  PerformerDeltaEvent,
  PerformerEvent,
} from "@performer/core";
import { jsx } from "../../../performer-core/dist/esm/jsx";

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
      const performer = new Performer(jsx(app, {}));
      setPerformer(performer);

      performer.addEventListener("*", (event) => {
        console.log("Received event", event);
        if (!(event instanceof PerformerDeltaEvent)) {
          return setEvents((prevEvents) => [...prevEvents, event]);
        }
        setEvents((prevEvents) => {
          const previous = prevEvents.findLast(
            (event): event is PerformerDeltaEvent =>
              event instanceof PerformerDeltaEvent &&
              event.detail.uid === event.detail.uid,
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
