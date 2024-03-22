import { expect, test } from "vitest";
import { Performer, PerformerEvent, resolveMessages } from "@performer/core";
import { App } from "../src/open-ended/index.js";

test("should have chat until ended", async () => {
  const performer = new Performer(<App />);
  performer.start();
  await performer.waitUntilListening();
  performer.input({
    role: "user",
    content: "Write a haiku about Javascript frameworks",
  });
  await performer.waitUntilListening();
  performer.input({
    role: "user",
    content: "Beautiful! That's all for now. Good bye!",
  });
  await Promise.race([
    performer.waitUntilFinished(),
    performer.waitUntilListening,
  ]);
  const messages = resolveMessages(performer.root);
  expect(performer.errors).toHaveLength(0);
}, 60_000);
