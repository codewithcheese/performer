import { assert, expect, test } from "vitest";
import {
  PerformerMessageEvent,
  Performer,
  PerformerEvent,
  resolveMessages,
  UserMessage,
  MessageDelta,
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
  expect(app.props.children[0].props.children).toEqual("Greet the user");
  expect(app.props.children[1].props.children.type.name).toEqual("NoProps");
});

test("should accept empty array", async () => {
  function App() {
    return () => (
      <>
        <system>Before</system>
        {[]}
        <system>After</system>
      </>
    );
  }
  const performer = new Performer(<App />);
  performer.start();
  await performer.waitUntilSettled();
  expect(performer.errors).toHaveLength(0);
  await testHydration(performer);
});

test("should accept array of children", async () => {
  function App() {
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
  const performer = new Performer(<App />);
  performer.start();
  await performer.waitUntilSettled();
  expect(performer.errors).toHaveLength(0);
  const messages = performer.getCurrentMessages();
  expect(messages).toHaveLength(5);
  await testHydration(performer);
});

test("message element should resolve stream into message object", async () => {
  const userMessage: MessageDelta = {
    role: "user",
    content: "Hello World",
  };
  let onMessageValue;
  let messageEventValue: PerformerEvent | undefined = undefined;
  function App() {
    return () => (
      <raw
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
  const performer = new Performer(<App />);
  performer.addEventListener("message", (event) => {
    messageEventValue = event;
  });
  performer.start();
  await performer.waitUntilSettled();
  const messages = performer.getCurrentMessages();
  expect(messages).toHaveLength(1);
  expect(messages[0]).toEqual(userMessage);
  expect(onMessageValue).toEqual(userMessage);
  assert(messageEventValue);
  expect(messageEventValue).instanceof(PerformerMessageEvent);
  await testHydration(performer);
});

test("message element should accept message object without stream", async () => {
  const userMessage: UserMessage = {
    role: "user",
    content: [{ type: "text", text: "Hello World" }],
  };
  function App() {
    return () => <raw message={userMessage} />;
  }
  const app = <App />;
  const performer = new Performer(<App />);
  performer.start();
  await performer.waitUntilSettled();
  const messages = performer.getCurrentMessages();
  expect(messages).toHaveLength(1);
  expect(messages[0]).toEqual(userMessage);
});

test("intrinsic element should accept content as children or prop");
