import { expect, test } from "vitest";
import { Performer, resolveMessages } from "@performer/core";
import { App } from "../src/open-ended/index.js";

test("should have chat until ended", async () => {
  const performer = new Performer(<App />);
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
}, 60_000);
