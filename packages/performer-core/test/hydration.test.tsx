import { assert, expect, test } from "vitest";
import {
  createContextId,
  MessageEvent,
  initContext,
  isTextContent,
  messagesToElements,
  Performer,
  UseHook,
  useInput,
  UserMessage,
  useState,
} from "../src/index.js";
import { testHydration } from "./util/test-hydration.js";

test("should serialize hooks", async () => {
  async function App({}, use: UseHook) {
    const context = initContext(createContextId<string>("test"), "1337");
    const state = useState("42");
    const resource = await use(() => Promise.resolve("420"));
    return () => (
      <>
        <system>{context.value}</system>
        <system>{state.value}</system>
        <system>{resource}</system>
      </>
    );
  }
  const performer = new Performer({ element: <App /> });
  performer.start();
  await performer.waitUntilSettled();
  await testHydration(performer);
});

test("should serialize when listening, for input and accept input when hydrated", async () => {
  async function App() {
    const messages = await useInput();
    return () => messagesToElements(messages);
  }
  const performer = new Performer({ element: <App /> });
  performer.start();
  await performer.waitUntilSettled();
  expect(performer.node?.child).toEqual(undefined);
  expect(performer.hasFinished).toEqual(false);
  const hydratedPerformer = await testHydration(performer);
  hydratedPerformer.start();
  await hydratedPerformer.waitUntilSettled();
  expect(hydratedPerformer.hasFinished).toEqual(false);
  const userMessage: UserMessage = {
    role: "user",
    content: [{ type: "text", text: "Hello, world!" }],
  };
  hydratedPerformer.input(new MessageEvent({ payload: userMessage }));
  await hydratedPerformer.waitUntilSettled();
  expect(hydratedPerformer.hasFinished).toEqual(true);
  // expect original performer node still undefined
  expect(performer.node?.child).toEqual(undefined);
  expect(hydratedPerformer.node?.child?.type).toEqual("user");
  assert(isTextContent(hydratedPerformer.node?.child?.props.content[0]));
  expect(hydratedPerformer.node?.child?.props.content[0].text).toEqual(
    "Hello, world!",
  );
});

test("should use hydrated input instead of listening again", async () => {
  async function App() {
    const messages = await useInput();
    return () => messagesToElements(messages);
  }
  const performer = new Performer({ element: <App /> });
  performer.start();
  await performer.waitUntilSettled();
  const userMessage: UserMessage = {
    role: "user",
    content: [{ type: "text", text: "Hello, world!" }],
  };
  performer.input(new MessageEvent({ payload: userMessage }));
  await performer.waitUntilSettled();
  expect(performer.node?.child?.type).toEqual("user");
  expect(performer.hasFinished).toEqual(true);
  const hydratedPerformer = await testHydration(performer);
  hydratedPerformer.start();
  await hydratedPerformer.waitUntilSettled();
  expect(hydratedPerformer.hasFinished).toEqual(true);
  expect(hydratedPerformer.node?.child?.type).toEqual("user");
  assert(isTextContent(hydratedPerformer.node?.child?.props.content[0]));
  expect(hydratedPerformer.node?.child?.props.content[0].text).toEqual(
    "Hello, world!",
  );
});
