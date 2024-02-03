import { assert, expect, test } from "vitest";
import {
  Assistant,
  PerformerMessage,
  isAssistantMessage,
  isSystemMessage,
  isToolMessage,
  resolveMessages,
  Performer,
  Tool,
  type ToolMessage,
} from "../../src/index.js";
import "dotenv/config";
import { z } from "zod";
import { ChatOpenAI } from "langchain/chat_models/openai";

test("should call model with messages", async () => {
  const app = (
    <>
      <system>Hello world in Javascript. Code only.</system>
      <Assistant />
    </>
  );
  const performer = new Performer({ element: app });
  performer.start();
  await performer.waitUntilSettled();
  expect(performer.node?.child?.type).toEqual("system");
  expect(performer.node?.child?.props.content).toEqual(
    "Hello world in Javascript. Code only.",
  );
  assert(performer.node?.child?.nextSibling?.type instanceof Function);
  expect(performer.node?.child?.nextSibling?.type.name).toEqual("Assistant");
  expect(performer.node?.child?.nextSibling?.child?.type).toEqual("message");
  expect(performer.node?.child?.nextSibling?.child?.props.stream.role).toEqual(
    "assistant",
  );
  expect(
    performer.node?.child?.nextSibling?.child?.props.stream.content,
  ).toHaveLength(1);
}, 10_000);

test("should call onMessage event handler after assistant response", async () => {
  let eventHandlerCalled = false;
  const app = (
    <>
      <system>1+1. Scalar only, no preamble.</system>
      <Assistant onMessage={() => (eventHandlerCalled = true)} />
    </>
  );
  const performer = new Performer({ element: app });
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
    async call(params: z.infer<typeof this.params>) {
      toolCall = params;
    }
  }
  const tool = new HelloTool();
  const model = new ChatOpenAI({ modelName: "gpt-4-1106-preview" });
  const eventMessages: PerformerMessage[] = [];
  const app = (
    <>
      <system>Say hello to world</system>
      <Assistant
        onMessage={(message) => eventMessages.push(message)}
        model={model}
        toolChoice={tool}
        tools={[tool]}
      />
    </>
  );
  const performer = new Performer({
    element: app,
  });
  performer.start();
  await performer.waitUntilSettled();
  expect(performer.hasFinished).toEqual(true);
  const messages = resolveMessages(performer.node);
  expect(messages).toHaveLength(2);
  expect(messages[0].role).toEqual("system");
  assert(isSystemMessage(messages[0]));
  assert(isAssistantMessage(messages[1]));
  assert(messages[1].tool_calls);
  expect(toolCall).toBeDefined();
  expect(eventMessages).toHaveLength(1);
  expect(eventMessages[0]).toEqual(messages[1]);
});

test.skipIf(process.env.TEST_MODEL_OLLAMA == null)(
  "should use ollama model phi",
  async () => {
    const { ChatOllama } = await import("langchain/chat_models/ollama");
    const ollama = new ChatOllama({ model: "phi" });
    const app = (
      <>
        <system>Greet the user concisely.</system>
        <Assistant model={ollama} />
      </>
    );
    const performer = new Performer({
      element: app,
    });
    performer.start();
    await performer.waitUntilSettled();
    expect(performer.hasFinished).toEqual(true);
    const messages = resolveMessages(performer.node);
    expect(messages).toHaveLength(2);
    expect(messages[0].role).toEqual("system");
    expect(messages[1].role).toEqual("assistant");
  },
  60_000,
);
