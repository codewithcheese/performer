import { assert, expect, test } from "vitest";
import {
  createContext,
  isTextContent,
  messagesToElements,
  Performer,
  useResource,
  useContextProvider,
  useInput,
  UserMessage,
  useState,
} from "../src/index.js";
import { testHydration } from "./util/test-hydration.js";

test("should serialize hooks", async () => {
  function App() {
    const context = useContextProvider(createContext<string>("test"), "1337");
    const state = useState("42");
    const resource = useResource(() => Promise.resolve("420"));
    return () => (
      <>
        <system>{context.value}</system>
        <system>{state.value}</system>
        <system>{resource}</system>
      </>
    );
  }
  const performer = new Performer(<App />);
  performer.start();
  await performer.waitUntilSettled();
  await testHydration(performer);
});

test("should serialize when listening, for input and accept input when hydrated", async () => {
  function App() {
    const messages = useInput();
    return () => messagesToElements(messages);
  }
  const performer = new Performer(<App />);
  performer.start();
  await performer.waitUntilSettled();
  expect(performer.root?.child).toEqual(undefined);
  expect(performer.hasFinished).toEqual(false);
  const hydratedPerformer = await testHydration(performer);
  hydratedPerformer.start();
  await hydratedPerformer.waitUntilSettled();
  expect(hydratedPerformer.hasFinished).toEqual(false);
  const userMessage: UserMessage = {
    role: "user",
    content: [{ type: "text", text: "Hello, world!" }],
  };
  hydratedPerformer.input(userMessage);
  await hydratedPerformer.waitUntilSettled();
  expect(hydratedPerformer.hasFinished).toEqual(true);
  // expect original performer node still undefined
  expect(performer.root?.child).toEqual(undefined);
  expect(hydratedPerformer.root?.child?.type).toEqual("user");
  assert(isTextContent(hydratedPerformer.root?.child?.props.content[0]));
  expect(hydratedPerformer.root?.child?.props.content[0].text).toEqual(
    "Hello, world!",
  );
});

test("should use hydrated input instead of listening again", async () => {
  function App() {
    const messages = useInput();
    return () => messagesToElements(messages);
  }
  const performer = new Performer(<App />);
  performer.start();
  await performer.waitUntilSettled();
  const userMessage: UserMessage = {
    role: "user",
    content: [{ type: "text", text: "Hello, world!" }],
  };
  performer.input(userMessage);
  await performer.waitUntilSettled();
  expect(performer.root?.child?.type).toEqual("user");
  expect(performer.hasFinished).toEqual(true);
  const hydratedPerformer = await testHydration(performer);
  hydratedPerformer.start();
  await hydratedPerformer.waitUntilSettled();
  expect(hydratedPerformer.hasFinished).toEqual(true);
  expect(hydratedPerformer.root?.child?.type).toEqual("user");
  assert(isTextContent(hydratedPerformer.root?.child?.props.content[0]));
  expect(hydratedPerformer.root?.child?.props.content[0].text).toEqual(
    "Hello, world!",
  );
});
