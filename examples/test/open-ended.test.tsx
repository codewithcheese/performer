import { expect, test } from "vitest";
import { Performer, PerformerEvent, resolveMessages } from "@performer/core";
import { App } from "../src/open-ended/index.js";

test("should have chat until ended", async () => {
  const performer = new Performer(<App />);
  performer.start();
  await performer.waitUntilSettled();
  performer.input({
    role: "user",
    content: "Write a haiku about Javascript frameworks",
  });
  await performer.waitUntilSettled();
  performer.input({
    role: "user",
    content: "Beautiful! That's all for now. Good bye!",
  });
  await performer.waitUntilSettled();
  const messages = resolveMessages(performer.root);
  expect(messages).toHaveLength(9);
}, 60_000);
