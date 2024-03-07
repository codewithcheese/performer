import { expect, test } from "vitest";
import {
  Performer,
  PerformerEvent,
  useDispatchEvent,
} from "../../src/index.js";

class MyEvent implements PerformerEvent {
  type = "my-event";
  threadId = "root";
  detail: { value: number };
  constructor(detail: { value: number }) {
    this.detail = detail;
  }
}

declare module "../../src/index.js" {
  interface PerformerEventMap {
    "my-event": MyEvent;
  }
}

test("should dispatch event from component", async () => {
  function App() {
    const dispatchEvent = useDispatchEvent();
    dispatchEvent(new MyEvent({ value: 1337 }));
    return () => <assistant>How may I serve the?</assistant>;
  }
  const performer = new Performer(<App />);
  let eventValues: number[] = [];
  performer.addEventListener("*", (evt) => {
    if ("value" in evt.detail) eventValues.push(evt.detail.value);
  });
  performer.start();
  await performer.waitUntilSettled();
  expect(eventValues).toEqual([1337]);
});
