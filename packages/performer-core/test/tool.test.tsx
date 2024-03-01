import { assert, expect, test } from "vitest";
import { z } from "zod";
import {
  Assistant,
  createTool,
  isAssistantMessage,
  isSystemMessage,
  Performer,
  PerformerMessage,
  resolveMessages,
  isToolMessage,
} from "../src/index.js";

test("should use tool with callback", async () => {
  let toolCall = undefined;
  const HelloSchema = z
    .object({
      name: z.string(),
    })
    .describe("Say hello");
  const tool = createTool("sayHello", HelloSchema, ({ name }) => {
    toolCall = name;
  });
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
  expect(eventMessages).toHaveLength(2);
  expect(eventMessages[0]).toEqual(messages[1]);
});

test("should use tool without callback", async () => {
  const HelloSchema = z
    .object({
      name: z.string(),
    })
    .describe("Say hello");
  const tool = createTool("sayHello", HelloSchema);
  const app = (
    <>
      <system>Say hello to world</system>
      <Assistant toolChoice={tool} tools={[tool]} />
    </>
  );
  const performer = new Performer(app);
  performer.start();
  await performer.waitUntilSettled();
  expect(performer.hasFinished).toEqual(true);
  const messages = resolveMessages(performer.root);
  expect(messages).toHaveLength(3);
  assert(isToolMessage(messages[2]));
  const assistant = performer.root?.child?.nextSibling;
  expect(
    assistant!.hooks["state-0"].value[0].content,
    "Expect Assistant tool messages state to equal tool message",
  ).toEqual(messages[2].content);
});

test("should use multiple tools", async () => {
  const WidgetCountSchema = z
    .object({
      count: z.number(),
    })
    .describe("Extract count of widgets");
  const WidgetNameSchema = z
    .object({
      name: z.string(),
    })
    .describe("Extact name of widget");
  let callCount = 0;
  function App() {
    const countTool = createTool("extractCount", WidgetCountSchema, () => {
      callCount += 1;
    });
    const nameTool = createTool("extractName", WidgetNameSchema, () => {
      callCount += 1;
    });
    return () => (
      <>
        <system>Use tools to extract widget information.</system>
        <user>
          Widget of the day:{"\n"}
          name: Gizmo{"\n"}
          count: 42
        </user>
        <Assistant toolChoice={"auto"} tools={[countTool, nameTool]} />
      </>
    );
  }
  const performer = new Performer(<App />);
  performer.start();
  await performer.waitUntilSettled();
  expect(callCount).toBeGreaterThan(0);
});
