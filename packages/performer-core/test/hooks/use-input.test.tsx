import { expect, test } from "vitest";
import { Performer, useInput } from "../../src/index.js";

test("should accept input before waitUntilSettled()", async () => {
  function App() {
    const messages = useInput();
    return () => messages.map((message) => <raw message={message} />);
  }
  const performer = new Performer(<App />);
  performer.start();
  performer.submit({
    role: "user",
    content: [{ type: "text", text: "Hold me close" }],
  });
  await performer.waitUntilFinished();
  expect(performer.root?.child?.action).toEqual("raw");
});

test("should accept input after waitUntilSettled", async () => {
  function App() {
    const messages = useInput();
    return () => messages.map((message) => <raw message={message} />);
  }
  const performer = new Performer(<App />);
  performer.start();
  await performer.waitUntilListening();
  expect(performer.inputNode?.action).toEqual(App);
  performer.submit({
    role: "user",
    content: [{ type: "text", text: "Hold me close" }],
  });
  await performer.waitUntilFinished();
  expect(performer.root?.child?.action).toEqual("raw");
});
