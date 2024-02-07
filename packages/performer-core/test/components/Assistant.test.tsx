import { assert, expect, test } from "vitest";
import {
  Assistant,
  isAssistantMessage,
  isMessage,
  isSystemMessage,
  Performer,
  PerformerMessage,
  resolveMessages,
  Tool,
} from "../../src/index.js";
import "dotenv/config";
import { z } from "zod";
import { isToolMessage } from "openai/lib/chatCompletionUtils";

test("should call model with messages", async () => {
  const app = (
    <>
      <system>Hello world in Javascript. Code only.</system>
      <Assistant />
    </>
  );
  const performer = new Performer(app);
  performer.start();
  await performer.waitUntilSettled();
  expect(performer.root?.child?.type).toEqual("system");
  expect(performer.root?.child?.props.content).toEqual(
    "Hello world in Javascript. Code only.",
  );
  assert(performer.root?.child?.nextSibling?.type instanceof Function);
  expect(performer.root?.child?.nextSibling?.type.name).toEqual("Assistant");
  assert(performer.root?.child?.nextSibling?.child?.type instanceof Function);
  expect(performer.root?.child?.nextSibling?.child?.type.name).toEqual(
    "Fragment",
  );
  expect(performer.root?.child?.nextSibling?.child?.child?.type).toEqual("raw");
  expect(
    performer.root?.child?.nextSibling?.child?.child?.hooks.message,
    "Expect raw element message hook to be defined.",
  ).toBeDefined();
  assert(
    isMessage(performer.root?.child?.nextSibling?.child?.child?.hooks?.message),
  );
  expect(
    performer.root?.child?.nextSibling?.child?.child?.hooks?.message.role,
  ).toEqual("assistant");
  expect(
    performer.root?.child?.nextSibling?.child?.child?.hooks?.message.content,
  ).not.toBeNull();
}, 10_000);

test("should call onMessage event handler after assistant response", async () => {
  let eventHandlerCalled = false;
  const app = (
    <>
      <system>1+1. Scalar only, no preamble.</system>
      <Assistant onMessage={() => (eventHandlerCalled = true)} />
    </>
  );
  const performer = new Performer(app);
  performer.start();
  await performer.waitUntilSettled();
  expect(eventHandlerCalled).toEqual(true);
});

test("should use tool", async () => {
  let toolCall = undefined;
  class HelloTool implements Tool {
    id = "hello";
    name = "say_hello";
    description = "Say hello";
    params = z.object({
      name: z.string(),
    });
    async call(_: string, params: z.infer<typeof this.params>) {
      toolCall = params;
    }
  }
  const tool = new HelloTool();
  const eventMessages: PerformerMessage[] = [];
  const app = (
    <>
      <system>Say hello to world</system>
      <Assistant
        onMessage={(message) => eventMessages.push(message)}
        model="gpt-4-1106-preview"
        toolChoice={tool}
        tools={[tool]}
      />
    </>
  );
  const performer = new Performer(app);
  performer.start();
  await performer.waitUntilSettled();
  expect(performer.hasFinished).toEqual(true);
  const messages = resolveMessages(performer.root);
  expect(messages).toHaveLength(3);
  expect(messages[0].role).toEqual("system");
  assert(isSystemMessage(messages[0]));
  assert(isAssistantMessage(messages[1]));
  assert(isToolMessage(messages[2]));
  assert(messages[1].tool_calls);
  expect(toolCall).toBeDefined();
  expect(eventMessages).toHaveLength(1);
  expect(eventMessages[0]).toEqual(messages[1]);
});
