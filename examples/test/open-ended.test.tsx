import { expect, test } from "vitest";
import {
  Performer,
  resolveMessages,
  PerformerMessageEvent,
} from "@performer/core";
import { App } from "../src/open-ended/index.js";

test("should have chat until ended", async () => {
  const element = <App />;
  const performer = new Performer({ element });
  performer.start();
  await performer.waitUntilSettled();
  performer.input(
    new PerformerMessageEvent({
      message: {
        role: "user",
        content: [
          { type: "text", text: "Write a haiku about Javascript frameworks" },
        ],
      },
    }),
  );
  await performer.waitUntilSettled();
  performer.input(
    new PerformerMessageEvent({
      message: {
        role: "user",
        content: [
          { type: "text", text: "Beautiful! That's all for now. Good bye!" },
        ],
      },
    }),
  );
  await performer.waitUntilSettled();
  const messages = resolveMessages(performer.node);
  expect(messages).toHaveLength(8);
}, 60_000);
