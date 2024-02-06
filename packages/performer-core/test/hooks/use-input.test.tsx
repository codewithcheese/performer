import { test, expect } from "vitest";
import { Performer, PerformerMessageEvent, useInput } from "../../src/index.js";

test("should use input given before waiting", async () => {
  async function App() {
    const messages = await useInput();
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

test("should use input given after waiting", async () => {
  async function App() {
    const messages = await useInput();
    return () => messages.map((message) => <raw message={message} />);
  }
  const performer = new Performer(<App />);
  performer.start();
  await performer.waitUntilSettled();
  expect(performer.inputNode?.type).toEqual(App);
  performer.input({
    role: "user",
    content: [{ type: "text", text: "Hold me close" }],
  });
  await performer.waitUntilSettled();
  expect(performer.root?.child?.type).toEqual("raw");
});
