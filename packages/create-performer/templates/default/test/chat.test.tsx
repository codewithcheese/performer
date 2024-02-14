import { test, expect } from "vitest";
import { Performer, resolveMessages } from "@performer/core";
import { App } from "../src/chat.js";

test("should greet the user and wait for input", async () => {
  const performer = new Performer(<App />);
  performer.start();
  await performer.waitUntilSettled();
  const messages = resolveMessages(performer.root);
  expect(messages[0].role).toEqual("system");
  expect(messages[1].role).toEqual("assistant");
});
