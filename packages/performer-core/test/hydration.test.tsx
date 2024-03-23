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
  pushElement,
} from "../src/index.js";
import { testHydration } from "./util/test-hydration.js";
import { jsx } from "../src/jsx/index.js";

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
  const hydratedPerformer = await testHydration(performer);
  expect(performer.state).toEqual(hydratedPerformer.state);
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
  expect(performer.state).toEqual("listening");
  const hydratedPerformer = await testHydration(performer);
  hydratedPerformer.start();
  await hydratedPerformer.waitUntilListening();
  const userMessage: UserMessage = {
    role: "user",
    content: [{ type: "text", text: "Hello, world!" }],
  };
  hydratedPerformer.input(userMessage);
  await hydratedPerformer.waitUntilFinished();
  // expect original performer node still undefined
  expect(performer.root?.child).toEqual(undefined);
  expect(hydratedPerformer.root?.child?.type).toEqual("user");
  assert(isTextContent(hydratedPerformer.root?.child?.props.content[0]));
  expect(hydratedPerformer.root?.child?.props.content[0].text).toEqual(
    "Hello, world!",
  );
  expect(hydratedPerformer.state).toEqual("finished");
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
  performer.input(userMessage);
  await performer.waitUntilFinished();
  expect(performer.root?.child?.type).toEqual("user");
  const hydratedPerformer = await testHydration(performer);
  hydratedPerformer.start();
  await hydratedPerformer.waitUntilFinished();
  expect(hydratedPerformer.root?.child?.type).toEqual("user");
  assert(isTextContent(hydratedPerformer.root?.child?.props.content[0]));
  expect(hydratedPerformer.root?.child?.props.content[0].text).toEqual(
    "Hello, world!",
  );
  expect(performer.state).toEqual(hydratedPerformer.state);
});

test("should mark pushed element as transplant", async () => {
  const performer = new Performer(<></>);
  performer.start();
  await performer.waitUntilSettled();
  pushElement(performer.root!, <user>0</user>);
  performer.start();
  await performer.waitUntilSettled();
  expect(performer.root!.child!.transplant).toEqual(true);
});

test("should hydrate inserted nodes", async () => {
  function Any({ id }: any) {
    return () => <system>{id}</system>;
  }
  const performer = new Performer(<></>);
  performer.start();
  await performer.waitUntilSettled();

  // push elements
  pushElement(performer.root!, <user>0</user>);
  pushElement(performer.root!, <Any id="1" />);
  // todo test inserting node at index, 0, -1 ,2
  // todo test inserting paused node
  // todo test inserting listening node

  // restart
  performer.start();
  await performer.waitUntilSettled();
  const messages = performer.getAllMessages();
  expect(messages.map((m) => m.content)).toEqual(["0", "1"]);
  // serialize
  const serialized = performer.serialize();
  console.log(JSON.stringify(serialized, null, 2));
  // hydrate new performer
  const hydratedPerformer = new Performer(<></>);
  await hydratedPerformer.hydrate(serialized, {
    user: jsx("user", {}),
    Any: jsx(Any, {}),
  });
  const hydratedMessages = hydratedPerformer.getAllMessages();
  expect(hydratedMessages.map((m) => m.content)).toEqual(["0", "1"]);
  expect(performer.state).toEqual(hydratedPerformer.state);
});
