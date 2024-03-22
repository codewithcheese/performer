import { expect, test } from "vitest";
import { Performer, useInput } from "../../src/index.js";

test("should accept input before waitUntilSettled()", async () => {
  function App() {
    const messages = useInput();
    return () => messages.map((message) => <raw message={message} />);
  }
  const performer = new Performer(<App />);
  performer.start();
  performer.input({
    role: "user",
    content: [{ type: "text", text: "Hold me close" }],
  });
  await performer.waitUntilSettled();
  expect(performer.root?.child?.type).toEqual("raw");
});

test("should accept input after waitUntilSettled", async () => {
  function App() {
    const messages = useInput();
    return () => messages.map((message) => <raw message={message} />);
  }
  const performer = new Performer(<App />);
  performer.start();
  await performer.waitUntilListening();
  expect(performer.inputNode?.type).toEqual(App);
  performer.input({
    role: "user",
    content: [{ type: "text", text: "Hold me close" }],
  });
  await performer.waitUntilSettled();
  expect(performer.root?.child?.type).toEqual("raw");
});
