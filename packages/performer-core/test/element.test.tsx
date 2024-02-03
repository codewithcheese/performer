import { assert, expect, test } from "vitest";
import {
  MessageEvent,
  Performer,
  PerformerEvent,
  resolveMessages,
  UserMessage,
} from "../src/index.js";
import { testHydration } from "./util/test-hydration.js";

test("should create intrinsic element", () => {
  const app = (
    <>
      <system>Greet the user</system>
      <assistant>Hello how can I help you?</assistant>
      <user>Tell me a joke, please.</user>
    </>
  );
  assert(app.type instanceof Function);
  expect(app.type.name).toEqual("Fragment");
  expect(app.props.children).toHaveLength(3);
  expect(app.props.children[0].type).toEqual("system");
  expect(app.props.children[1].type).toEqual("assistant");
  expect(app.props.children[2].type).toEqual("user");
});

test("should create element from JSX", () => {
  function TextChild() {
    return () => {};
  }
  function ElementChild() {
    return () => {};
  }
  function NoProps() {
    return () => {};
  }
  const app = (
    <>
      <TextChild>Greet the user</TextChild>
      <ElementChild>
        <NoProps />
      </ElementChild>
    </>
  );
  assert(app.type instanceof Function);
  expect(app.type.name).toEqual("Fragment");
  expect(app.props.children).toHaveLength(2);
  expect(app.props.children[0].type.name).toEqual("TextChild");
  expect(app.props.children[0].props.content).toEqual("Greet the user");
  expect(app.props.children[1].props.children).toHaveLength(1);
  expect(app.props.children[1].props.children[0].type.name).toEqual("NoProps");
});

test("should concatenate multiple string children", () => {
  const name = "world";
  const app = <>Hello {name}, how are you?</>;
  console.log(app);
});

test("should throw if text and element children", () => {
  expect(() => (
    <>
      Hello World
      <></>
    </>
  )).toThrow();
});

test("should accept empty array", async () => {
  function EmptyArray() {
    return () => (
      <>
        <system>Before</system>
        {[]}
        <system>After</system>
      </>
    );
  }
  const app = <EmptyArray />;
  // todo
});

test("should accept array of children", async () => {
  function EmptyArray() {
    return () => (
      <>
        <system>Before</system>
        {["One", "Two", "Three"].map((item) => (
          <system>{item}</system>
        ))}
        <system>After</system>
      </>
    );
  }
  const app = <EmptyArray />;
  // todo
});

test("message element should resolve stream into message object", async () => {
  const userMessage: UserMessage = {
    role: "user",
    content: [{ type: "text", text: "Hello World" }],
  };
  let onMessageValue;
  let messageEventValue: PerformerEvent | undefined = undefined;
  function App() {
    return () => (
      <message
        onMessage={(message) => (onMessageValue = message)}
        stream={
          new ReadableStream({
            start(controller) {
              controller.enqueue(userMessage);
              controller.close();
            },
          })
        }
      />
    );
  }
  const app = <App />;
  const performer = new Performer({ element: <App /> });
  performer.addEventListener("message", (event) => {
    messageEventValue = event;
  });
  performer.start();
  await performer.waitUntilSettled();
  const messages = resolveMessages(performer.node);
  expect(messages).toHaveLength(1);
  expect(messages[0]).toEqual(userMessage);
  expect(onMessageValue).toEqual(userMessage);
  assert(messageEventValue);
  expect(messageEventValue).instanceof(MessageEvent);
  await testHydration(performer);
});

test("message element should accept message object without stream", async () => {
  const userMessage: UserMessage = {
    role: "user",
    content: [{ type: "text", text: "Hello World" }],
  };
  function App() {
    return () => <message message={userMessage} />;
  }
  const app = <App />;
  const performer = new Performer({ element: <App /> });
  performer.start();
  await performer.waitUntilSettled();
  const messages = resolveMessages(performer.node);
  expect(messages).toHaveLength(1);
  expect(messages[0]).toEqual(userMessage);
});
