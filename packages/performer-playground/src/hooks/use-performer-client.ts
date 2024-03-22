import { useEffect, useState } from "react";
import {
  Component,
  concatDelta,
  Performer,
  PerformerDeltaEvent,
  PerformerEvent,
  PerformerOptions,
  PerformerState,
} from "@performer/core";
import { jsx } from "@performer/core/jsx-runtime";
import consola from "consola";

const logger = consola.withTag("usePerformerClient");

export function usePerformerClient(
  app: Component<any> | null,
  options: PerformerOptions = {},
) {
  const [events, setEvents] = useState<PerformerEvent[]>([]);
  const [performer, setPerformer] = useState<Performer | null>(null);
  const [state, setState] = useState<PerformerState>("pending");

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
      const performer = new Performer(jsx(app, {}), options);
      setPerformer(performer);

      performer.addEventListener("*", (event) => {
        setState(performer.state);
        if (event.type === "message") {
          setEvents((prevEvents) => {
            const previous = prevEvents.findLast(
              (prev) =>
                prev.type === "delta" && prev.detail.uid === event.detail.uid,
            );

            if (previous) {
              logger.debug(
                `event=${event.type} message="Found delta, discarding message." uid=${event.detail.uid} detail=${JSON.stringify(event.detail)}`,
              );
              return prevEvents;
            } else {
              logger.debug(
                `event=${event.type} message="Adding message." uid=${event.detail.uid} detail=${JSON.stringify(event.detail)}`,
              );
              return [...prevEvents, event];
            }
          });
        } else if (event.type !== "delta") {
          logger.debug(`event=${event.type}`);
          setEvents((prevEvents) => [...prevEvents, event]);
        } else {
          setEvents((prevEvents) => applyDeltaEvent(prevEvents, event));
        }
      });
      performer.start();
    } catch (e) {
      logger.error("Performer exception", e);
    }
  }, [app]);

  return { events, sendMessage, state };
}

function applyDeltaEvent(
  prevEvents: PerformerEvent[],
  event: PerformerDeltaEvent,
) {
  const previousIndex = prevEvents.findIndex(
    (prev) => prev.type === "delta" && prev.detail.uid === event.detail.uid,
  );
  const previous =
    previousIndex > -1 && (prevEvents[previousIndex] as PerformerDeltaEvent);
  if (!previous) {
    logger.debug(
      `event=${event.type} message="No previous delta, adding new." uid=${event.detail.uid} detail=${JSON.stringify(event.detail)}`,
    );
    return [...prevEvents, event];
  }
  logger.debug(
    `event=${event.type} message="Previous delta found, concatenating" uid=${event.detail.uid} detail=${JSON.stringify(event.detail)}`,
  );
  concatDelta(previous.detail.delta, event.detail.delta);
  return prevEvents.toSpliced(previousIndex, 1, previous);
}
