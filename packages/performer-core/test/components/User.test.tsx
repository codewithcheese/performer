import { assert, expect, test } from "vitest";
import {
  isTextContent,
  PerformerMessageEvent,
  Performer,
  resolveMessages,
  User,
  UserMessage,
} from "../../src/index.js";
import { testHydration } from "../util/test-hydration.js";

test("should accept user input", async () => {
  const userMessage: UserMessage = {
    role: "user",
    content: "Hello, world!",
  };
  const app = (
    <User onMessage={(message) => expect(message).toEqual(userMessage)} />
  );
  const performer = new Performer(app);
  performer.start();
  performer.addEventListener("*", (event) =>
    console.log(`Event ${event.type}`),
  );
  expect(performer.hasFinished).toEqual(false);
  performer.input(userMessage);
  await performer.waitUntilSettled();
  assert(performer.root?.type instanceof Function);
  expect(performer.root?.type.name).toEqual("User");
  const messages = resolveMessages(performer.root);
  expect(messages).toHaveLength(1);
  expect(messages[0].role).toEqual("user");
  expect(messages[0].content).toEqual("Hello, world!");
  await testHydration(performer);
});
