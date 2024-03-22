import { expect, test } from "vitest";
import {
  Assistant,
  Performer,
  PerformerErrorEvent,
  PerformerMessageEvent,
  User,
} from "../src/index.js";
import { sleep } from "openai/core";

test("should wait for input before performer is finished", async () => {
  const app = <User />;
  const performer = new Performer(app);
  console.time("Render");
  performer.start();
  await performer.waitUntilListening();
  expect(performer.inputNode).toBeDefined();
  performer.input({
    role: "user",
    content: [{ type: "text", text: "Hold me close" }],
  });
  await performer.waitUntilSettled();
});

test("should wait for multiple inputs", async () => {
  const app = (
    <>
      <User />
      <User />
      <User />
    </>
  );
  const performer = new Performer(app);
  console.time("Render");
  performer.start();
  await performer.waitUntilListening();
  performer.input({
    role: "user",
    content: [{ type: "text", text: "One" }],
  });
  await performer.waitUntilListening();
  performer.input({
    role: "user",
    content: [{ type: "text", text: "Two" }],
  });
  await performer.waitUntilListening();
  performer.input({
    role: "user",
    content: [{ type: "text", text: "Three" }],
  });
  await performer.waitUntilSettled();
});

test("should abort assistant response", async () => {
  const app = (
    <>
      <system>Hello world in Javascript. Code only.</system>
      <Assistant />
    </>
  );
  const performer = new Performer(app, { throwOnError: false });
  const events: PerformerErrorEvent[] = [];
  performer.addEventListener("error", (event) => {
    events.push(event);
  });
  performer.start();
  performer.abort();
  await performer.waitUntilSettled();
  await sleep(1000);
  // expect(events).toHaveLength(1);
});
