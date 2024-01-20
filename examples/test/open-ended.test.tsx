import { expect, test } from "vitest";
import { Performer } from "@performer/core";
import { App } from "../src/open-ended/index.js";
import { resolveMessages } from "@performer/core";
import { createMessageEvent } from "@performer/core";

test("should have chat until ended", async () => {
  const element = <App />;
  const performer = new Performer({ element });
  performer.start();
  await performer.waitUntilSettled();
  performer.input(
    createMessageEvent({
      role: "user",
      content: [
        { type: "text", text: "Write a haiku about Javascript frameworks" },
      ],
    }),
  );
  await performer.waitUntilSettled();
  performer.input(
    createMessageEvent({
      role: "user",
      content: [
        { type: "text", text: "Beautiful! That's all for now. Good bye!" },
      ],
    }),
  );
  await performer.waitUntilSettled();
  const messages = resolveMessages(performer.node);
  expect(messages).toHaveLength(8);
}, 60_000);
