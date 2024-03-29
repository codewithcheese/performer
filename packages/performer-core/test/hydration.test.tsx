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
  await performer.waitUntilFinished();
  await testHydration(performer);
});

test("should serialize when listening, for input and accept input when hydrated", async () => {
  function App() {
    const messages = useInput();
    return () => messagesToElements(messages);
  }
  const performer = new Performer(<App />);
  performer.start();
  await performer.waitUntilListening();
  expect(performer.root?.child).toEqual(undefined);
  const hydratedPerformer = await testHydration(performer);
  hydratedPerformer.start();
  await hydratedPerformer.waitUntilListening();
  const userMessage: UserMessage = {
    role: "user",
    content: [{ type: "text", text: "Hello, world!" }],
  };
  hydratedPerformer.submit(userMessage);
  await hydratedPerformer.waitUntilFinished();
  // expect original performer node still undefined
  expect(performer.root?.child).toEqual(undefined);
  expect(hydratedPerformer.root?.child?.action).toEqual("user");
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
  await performer.waitUntilListening();
  const userMessage: UserMessage = {
    role: "user",
    content: [{ type: "text", text: "Hello, world!" }],
  };
  performer.submit(userMessage);
  await performer.waitUntilFinished();
  expect(performer.root?.child?.action).toEqual("user");
  const hydratedPerformer = await testHydration(performer);
  hydratedPerformer.start();
  await hydratedPerformer.waitUntilFinished();
  expect(hydratedPerformer.root?.child?.action).toEqual("user");
  assert(isTextContent(hydratedPerformer.root?.child?.props.content[0]));
  expect(hydratedPerformer.root?.child?.props.content[0].text).toEqual(
    "Hello, world!",
  );
});
