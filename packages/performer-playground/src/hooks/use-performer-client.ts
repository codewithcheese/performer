import { useEffect, useState } from "react";
import {
  Component,
  concatDelta,
  Performer,
  PerformerDeltaEvent,
  PerformerEvent,
  PerformerMessageEvent,
} from "@performer/core";
import { jsx } from "@performer/core/jsx-runtime";
import consola from "consola";

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
        consola.info(
          `usePerformerClient event=${event.type} message="Received event"`,
        );
        if (event instanceof PerformerMessageEvent) {
          return setEvents((prevEvents) => {
            const previous = prevEvents.findLast(
              (prev): prev is PerformerDeltaEvent =>
                prev instanceof PerformerDeltaEvent &&
                prev.detail.uid === event.detail.uid,
            );

            if (previous) {
              consola.info(
                `usePerformerClient event=${event.type} message="Found delta, discarding message." role=${event.detail.message.role} uid=${event.detail.uid}`,
              );
              return prevEvents;
            } else {
              consola.info(
                `usePerformerClient event=${event.type} message="Adding message." content="${event.detail.message.content}" role=${event.detail.message.role} uid=${event.detail.uid}`,
              );
              return [...prevEvents, event];
            }
          });
        } else if (!(event instanceof PerformerDeltaEvent)) {
          consola.info(`usePerformerClient event=${event.type}`);
          return setEvents((prevEvents) => [...prevEvents, event]);
        } else {
          setEvents((prevEvents) => {
            const previous = prevEvents.findLast(
              (prev): prev is PerformerDeltaEvent =>
                prev instanceof PerformerDeltaEvent &&
                prev.detail.uid === event.detail.uid,
            );
            if (!previous) {
              consola.info(
                `usePerformerClient event=${event.type} message="No previous delta, adding new." uid=${event.detail.uid}`,
              );
              return [...prevEvents, event];
            }
            consola.info(
              `usePerformerClient event=${event.type} message="Previous delta found, concatenating" uid=${event.detail.uid}`,
            );
            concatDelta(previous.detail.delta, event.detail.delta);
            return prevEvents.toSpliced(prevEvents.length - 1, 1, previous);
          });
        }
      });
      performer.start();
    } catch (e) {
      console.error("Performer exception", e);
    }
  }, [app]);

  return { events, sendMessage };
}
