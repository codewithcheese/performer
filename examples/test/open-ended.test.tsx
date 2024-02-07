import { expect, test } from "vitest";
import { Performer, PerformerEvent, resolveMessages } from "@performer/core";
import { App } from "../src/open-ended/index.js";

test("should have chat until ended", async () => {
  const performer = new Performer(<App />);
  const events: PerformerEvent[] = [];
  performer.addEventListener("*", (evt) => {
    events.push(evt);
  });
  performer.start();
  await performer.waitUntilSettled();
  performer.input({
    role: "user",
    content: [
      { type: "text", text: "Write a haiku about Javascript frameworks" },
    ],
  });
  await performer.waitUntilSettled();
  performer.input({
    role: "user",
    content: [
      { type: "text", text: "Beautiful! That's all for now. Good bye!" },
    ],
  });
  await performer.waitUntilSettled();
  const messages = resolveMessages(performer.root);
  expect(messages).toHaveLength(8);
  expect(events).toHaveLength(20);
}, 60_000);
