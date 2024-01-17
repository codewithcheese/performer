import { sleep } from "../src/util/sleep.js";
import { assert, expect, test } from "vitest";
import {
  PerformerMessage,
  resolveMessages,
  Performer,
  useState,
} from "../src/index.js";
import { resetFinished } from "./util/reset-finished.js";

async function Message({ content }: any) {
  return () => <user content={[{ type: "text", text: content }]} />;
}
async function Container({ children }: any) {
  return () => children;
}

test("should render and resolve intrinsic element", async () => {
  const app = (
    <>
      <system>Greet the user</system>
      <assistant>Hello how can I help you?</assistant>
      <user>Tell me a joke, please.</user>
    </>
  );
  const performer = new Performer({ element: app });
  performer.start();
  await performer.waitUntilSettled();
  const messages = resolveMessages(performer.node);
  expect(messages).toHaveLength(3);
  expect(messages[0].role).toEqual("system");
  expect(messages[1].role).toEqual("assistant");
  expect(messages[2].role).toEqual("user");
});

test("should render view", async () => {
  async function AChild() {
    return () => null;
  }
  async function BChild() {
    return () => null;
  }
  async function AComponent() {
    console.log("hello");
    await sleep(10);
    console.log("world");
    return () => (
      <Container>
        <AChild>hello a</AChild>
        <AChild>hello a+</AChild>
        <BChild>hello b</BChild>
      </Container>
    );
  }
  const app = <AComponent />;
  const performer = new Performer({ element: app });
  performer.start();
  await performer.waitUntilSettled();
});

test("should update prop when signal changes", async () => {
  function Receiver({ message }: any) {
    expect(message, "Message should not be null").not.toBeNull();
    return () => {};
  }

  function App() {
    const message = useState<PerformerMessage | null>(null);
    return () => (
      <>
        <user
          onMessage={(userMessage) => {
            console.log("onMessage", userMessage);
            message.value = userMessage;
          }}
        >
          Hello world
        </user>
        <Receiver message={message.value} />
      </>
    );
  }
  const performer = new Performer({ element: <App /> });
  performer.start();
  await performer.waitUntilSettled();
});

test("should update and run message actions when state changes", async () => {
  function DelayedIf({ children }: any) {
    const predicate = useState(false);
    return () => predicate.value && children;
  }
  const app = (
    <>
      <Message>X = 0. Answer with scalar.</Message>
      <DelayedIf>
        <Message>Increment X by 1</Message>
        <Message>X = 1</Message>
      </DelayedIf>
    </>
  );
  const performer = new Performer({ element: app });
  performer.start();
  await performer.waitUntilSettled();
  let messages = resolveMessages(performer.node);
  expect(messages).toHaveLength(1);

  resetFinished(performer);
  performer.node!.child!.nextSibling!.hooks["state-0"].value = true;

  await performer.waitUntilSettled();
  messages = resolveMessages(performer.node);
  expect(messages).toHaveLength(3);
});

test("should update links when elements are reordered", async () => {
  function Rotate({ children }: any) {
    const offset = useState(0);
    return () => {
      let _offset = offset.value % children.length;
      return children.slice(_offset).concat(children.slice(0, _offset));
    };
  }
  function Item({ content }: any) {
    return () => <user content={[{ type: "text", text: content }]} />;
  }
  const app = (
    <Rotate>
      <Item>One</Item>
      <Item>Two</Item>
      <Item>Three</Item>
    </Rotate>
  );
  const performer = new Performer({ element: app });
  performer.start();
  await performer.waitUntilSettled();

  let messages = resolveMessages(performer.node, undefined, {
    showResolveMessages: true,
  });
  expect(messages).toHaveLength(3);

  resetFinished(performer);
  const offset = performer.node!.hooks["state-0"];
  offset!.value += 1;

  await performer.waitUntilSettled();
  messages = resolveMessages(performer.node, undefined, {
    showResolveMessages: true,
  });
  expect(messages).toHaveLength(3);
});

test("should render new elements when dynamically added or removed", async () => {
  function Repeat({ children }: any) {
    const times = useState(1);
    return () => Array(times.value).fill(children).flat();
  }
  const app = (
    <Repeat>
      <Message>Greet the user</Message>
    </Repeat>
  );
  const performer = new Performer({ element: app });
  performer.start();
  await performer.waitUntilSettled();
  let messages = resolveMessages(performer.node, undefined, {
    showResolveMessages: true,
  });
  expect(messages).toHaveLength(1);

  resetFinished(performer);
  const times = performer.node!.hooks["state-0"];
  times.value += 4;

  await performer.waitUntilSettled();
  messages = resolveMessages(performer.node, undefined, {
    showResolveMessages: true,
  });
  expect(messages).toHaveLength(5);

  resetFinished(performer);
  times.value -= 2;

  await performer.waitUntilSettled();
  messages = resolveMessages(performer.node, undefined, {
    showResolveMessages: true,
  });
  expect(messages).toHaveLength(3);

  resetFinished(performer);
  times.value -= 1;

  await performer.waitUntilSettled();
  messages = resolveMessages(performer.node, undefined, {
    showResolveMessages: true,
  });
  expect(messages).toHaveLength(2);
});

test("should unlink messages when removed by conditional", async () => {
  function Temp({ children }: any) {
    const predicate = useState<boolean>(true);
    return () => (predicate.value ? children : []);
  }
  const app = (
    <Temp>
      <Message>Help the user</Message>
      <Message>What is the population of Australia?</Message>
    </Temp>
  );
  const performer = new Performer({ element: app });
  performer.start();
  await performer.waitUntilSettled();
  let messages = resolveMessages(performer.node, undefined, {
    showResolveMessages: true,
  });
  expect(
    messages.length,
    "Expect 2 messages before they are unlinked by `If`",
  ).toEqual(2);

  resetFinished(performer);
  const predicate = performer.node!.hooks["state-0"];
  predicate.value = false;

  await performer.waitUntilSettled();
  messages = resolveMessages(performer.node, undefined, {
    showResolveMessages: true,
  });
  expect(
    messages.length,
    "Expect 0 messages after they are unlinked by `If`",
  ).toEqual(0);
});

test("should wait for async message actions", async () => {
  async function AsyncMessage() {
    const isReady = useState<boolean>(false);
    await sleep(10);
    isReady.value = true;
    return () => isReady && <Message>Your name is Bob</Message>;
  }

  const app = (
    <Container>
      <AsyncMessage />
      <Message>Hi, how can I help?</Message>
      <Message>Hold me close</Message>
    </Container>
  );
  const performer = new Performer({ element: app });
  console.time("Render");
  performer.start();
  await performer.waitUntilFinished;
  console.timeEnd("Render");
  const messages = resolveMessages(performer.node);
  expect(messages).toHaveLength(3);
  expect(messages[0]).toEqual({
    role: "user",
    content: [{ type: "text", text: "Your name is Bob" }],
  });
  expect(messages[1]).toEqual({
    role: "user",
    content: [{ type: "text", text: "Hi, how can I help?" }],
  });
  expect(messages[2]).toEqual({
    role: "user",
    content: [{ type: "text", text: "Hold me close" }],
  });
});

test("should render tree", async () => {
  function First(props: any) {
    return () => props.children;
  }
  function Second(props: any) {
    return () => props.children;
  }
  function Greet(props: any) {
    return () => props.children;
  }
  function Child() {
    return () => null;
  }
  function Third() {
    return () => <Child />;
  }

  const app = (
    <>
      <First>Greet the user</First>
      <Second>
        <Greet>Hello world</Greet>
        <Third />
      </Second>
    </>
  );
  const performer = new Performer({ element: app });
  performer.start();
  await performer.waitUntilSettled();
  const root = performer.node!;
  expect(root.parent).toBeUndefined();
  expect(root.nextSibling).toBeUndefined();
  expect(root.prevSibling).toBeUndefined();
  assert(root.child?.type instanceof Function);
  expect(root.child?.type.name).toEqual("First");
  expect(root.child?.props.content).toEqual("Greet the user");
  assert(root.child?.nextSibling?.type instanceof Function);
  expect(root.child?.nextSibling?.type.name).toEqual("Second");
  assert(root.child?.nextSibling?.child?.type instanceof Function);
  expect(root.child?.nextSibling?.child?.type.name).toEqual("Greet");
  assert(root.child?.nextSibling?.child?.nextSibling?.type instanceof Function);
  expect(root.child?.nextSibling?.child?.nextSibling?.type.name).toEqual(
    "Third",
  );
  assert(
    root.child?.nextSibling?.child?.nextSibling?.child?.type instanceof
      Function,
  );
  expect(root.child?.nextSibling?.child?.nextSibling?.child?.type.name).toEqual(
    "Child",
  );
  expect(root.child?.nextSibling?.child?.props.content).toEqual("Hello world");
  expect(root.child?.nextSibling?.nextSibling).toBeUndefined();
});
