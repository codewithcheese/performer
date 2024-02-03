import { expect, test } from "vitest";
import { Performer } from "@performer/core";
import { App } from "../src/step-back-prompting/index.js";
import { resolveMessages, PerformerMessageEvent } from "@performer/core";

test("should use step back prompting with results from DDG to answer users question", async () => {
  const performer = new Performer(<App />);
  performer.start();
  await performer.waitUntilSettled();
  performer.input(
    new PerformerMessageEvent({
      message: {
        role: "user",
        content: [{ type: "text", text: "Who won the 2023 US Open?" }],
      },
    }),
  );
  await performer.waitUntilSettled();
  const messages = resolveMessages(performer.root);
  expect(messages).toHaveLength(4);
}, 60_000);
