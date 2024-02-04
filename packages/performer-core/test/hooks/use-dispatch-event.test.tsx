import { expect, test } from "vitest";
import { Performer, useDispatchEvent } from "../../src/index.js";

declare module "../../src/index.js" {
  interface PerformerEventMap {
    test: CustomEvent<{ value: number }>;
  }
}

test("should dispatch event from component", async () => {
  async function App() {
    const dispatchEvent = useDispatchEvent();
    dispatchEvent(new CustomEvent("test", { detail: { value: 1 } }));
    return () => <assistant>How may I serve the?</assistant>;
  }
  const performer = new Performer(<App />);
  let eventValue = undefined;
  performer.addEventListener("test", (evt) => {
    eventValue = evt.detail.value;
  });
  performer.start();
  await performer.waitUntilSettled();
  expect(eventValue).toEqual(1);
});
