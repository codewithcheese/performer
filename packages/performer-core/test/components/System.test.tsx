import { expect, test, assert } from "vitest";
import {
  PerformerMessage,
  resolveMessages,
  Performer,
  SystemMessage,
} from "../../src/index.js";

test("should add system message with content", () => {
  const systemMessage: SystemMessage = {
    role: "system" as const,
    content: [{ type: "text", text: "Hello world" }],
  };
  const onMessage = (message: PerformerMessage) =>
    expect(message).toEqual(systemMessage);
  const element = <system onMessage={onMessage}>Hello world</system>;
  const performer = new Performer({ element });
  performer.start();
  const messages = resolveMessages(performer.node);
  expect(messages[0]).toEqual(systemMessage);
});
