import { expect, test } from "vitest";
import {
  Performer,
  PerformerEventBase,
  useDispatchEvent,
} from "../../src/index.js";

interface MyEvent extends PerformerEventBase {
  type: "my-event";
  detail: { value: number };
}

declare module "../../src/index.js" {
  interface PerformerEventMap {
    "my-event": MyEvent;
  }
}

test("should dispatch event from component", async () => {
  function App() {
    const dispatchEvent = useDispatchEvent();
    dispatchEvent({
      type: "my-event",
      threadId: "root",
      detail: { value: 1337 },
    });
    return () => <assistant>How may I serve the?</assistant>;
  }
  const performer = new Performer(<App />);
  let eventValues: number[] = [];
  performer.addEventListener("*", (evt) => {
    if ("value" in evt.detail) eventValues.push(evt.detail.value);
  });
  performer.start();
  await performer.waitUntilFinished();
  expect(eventValues).toEqual([1337]);
});
