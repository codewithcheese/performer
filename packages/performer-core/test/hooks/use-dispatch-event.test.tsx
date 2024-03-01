import { expect, test } from "vitest";
import { Performer, useDispatchEvent } from "../../src/index.js";

class MyEvent extends CustomEvent<{ value: number }> {
  constructor(detail: { value: number }) {
    super("my-event", { detail });
  }
}

declare module "../../src/index.js" {
  interface PerformerEventMap {
    test: CustomEvent<{ value: number }>;
    "my-event": MyEvent;
  }
}

test("should dispatch event from component", async () => {
  function App() {
    const dispatchEvent = useDispatchEvent();
    dispatchEvent(new CustomEvent("test", { detail: { value: 42 } }));
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
  expect(eventValues).toEqual([42, 1337]);
});
