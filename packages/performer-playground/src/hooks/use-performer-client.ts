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
    performer.input({ role: "user", content: text });
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
        // consola.info(
        //   `usePerformerClient event=${event.type} message="Received event" detail=${JSON.stringify(event.detail)}`,
        // );
        if (event instanceof PerformerMessageEvent) {
          setEvents((prevEvents) => {
            const previous = prevEvents.findLast(
              (prev): prev is PerformerDeltaEvent =>
                prev instanceof PerformerDeltaEvent &&
                prev.detail.uid === event.detail.uid,
            );

            if (previous) {
              consola.info(
                `usePerformerClient event=${event.type} message="Found delta, discarding message." uid=${event.detail.uid} detail=${JSON.stringify(event.detail)}`,
              );
              return prevEvents;
            } else {
              consola.info(
                `usePerformerClient event=${event.type} message="Adding message." uid=${event.detail.uid} detail=${JSON.stringify(event.detail)}`,
              );
              return [...prevEvents, event];
            }
          });
        } else if (!(event instanceof PerformerDeltaEvent)) {
          consola.info(`usePerformerClient event=${event.type}`);
          setEvents((prevEvents) => [...prevEvents, event]);
        } else {
          setEvents((prevEvents) => {
            const newEvents = applyDeltaEvent(prevEvents, event);
            console.info(
              `usePerformerClient:applyDeltaEvent uids=${JSON.stringify(mapUids(newEvents))}`,
            );
            return newEvents;
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

function applyDeltaEvent(
  prevEvents: PerformerEvent[],
  event: PerformerDeltaEvent,
) {
  const previousIndex = prevEvents.findIndex(
    (prev): prev is PerformerDeltaEvent =>
      prev instanceof PerformerDeltaEvent &&
      prev.detail.uid === event.detail.uid,
  );
  const previous = previousIndex > -1 && prevEvents[previousIndex];
  if (!previous) {
    consola.info(
      `usePerformerClient event=${event.type} message="No previous delta, adding new." uid=${event.detail.uid} detail=${JSON.stringify(event.detail)} prev=${JSON.stringify(mapUids(prevEvents))}`,
    );
    return [...prevEvents, event];
  }
  consola.info(
    `usePerformerClient event=${event.type} message="Previous delta found, concatenating" uid=${event.detail.uid} detail=${JSON.stringify(event.detail)}`,
  );
  concatDelta(previous.detail.delta, event.detail.delta);
  return prevEvents.toSpliced(previousIndex, 1, previous);
}

function mapUids(prevEvents: PerformerEvent[]) {
  return prevEvents
    .filter((p) => p instanceof PerformerDeltaEvent)
    .map((p) => p.detail.uid);
}
