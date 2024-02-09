import { sleep } from "../src/util/sleep.js";
import { assert, expect, test } from "vitest";
import {
  PerformerMessage,
  resolveMessages,
  Performer,
  useState,
  PerformerErrorEvent,
} from "../src/index.js";
import { testHydration } from "./util/test-hydration.js";
import { expectTree } from "./util/expect-tree.js";

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
  const performer = new Performer(app);
  performer.start();
  await performer.waitUntilSettled();
  const messages = resolveMessages(performer.root);
  expect(messages).toHaveLength(3);
  expect(messages[0].role).toEqual("system");
  expect(messages[1].role).toEqual("assistant");
  expect(messages[2].role).toEqual("user");
  await testHydration(performer);
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
  const performer = new Performer(app);
  performer.start();
  await performer.waitUntilSettled();
  await testHydration(performer);
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
  const performer = new Performer(<App />);
  performer.start();
  await performer.waitUntilSettled();
  await testHydration(performer);
});

test("should update and run message actions when state changes", async () => {
  function DelayedIf({ children }: any) {
    const predicate = useState(false);
    return () => predicate.value && children;
  }
  const app = (
    <>
      <user>X = 0. Answer with scalar.</user>
      <DelayedIf>
        <user>Increment X by 1</user>
        <user>X = 1</user>
      </DelayedIf>
    </>
  );
  const performer = new Performer(app);
  performer.start();
  await performer.waitUntilSettled();
  let messages = resolveMessages(performer.root);
  expect(messages).toHaveLength(1);

  performer.hasFinished = false;
  performer.root!.child!.nextSibling!.hooks["state-0"].value = true;

  await performer.waitUntilSettled();
  messages = resolveMessages(performer.root);
  expect(messages).toHaveLength(3);
  await testHydration(performer);
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
  const performer = new Performer(app);
  performer.start();
  await performer.waitUntilSettled();

  let messages = resolveMessages(performer.root, undefined, {
    showResolveMessages: true,
  });
  expect(messages).toHaveLength(3);

  performer.hasFinished = false;
  const offset = performer.root!.hooks["state-0"];
  offset!.value += 1;

  await performer.waitUntilSettled();
  messages = resolveMessages(performer.root, undefined, {
    showResolveMessages: true,
  });
  expect(messages).toHaveLength(3);
  await testHydration(performer);
});

test("should render new elements when dynamically added or removed", async () => {
  function Repeat({ children }: any) {
    const times = useState(1);
    return () => Array(times.value).fill(children).flat();
  }
  const app = (
    <Repeat>
      <user>Greet the user</user>
    </Repeat>
  );
  let performer = new Performer(app);
  performer.start();
  await performer.waitUntilSettled();
  let messages = resolveMessages(performer.root, undefined, {
    showResolveMessages: true,
  });
  expect(messages).toHaveLength(1);
  expect(performer.hasFinished).toEqual(true);

  // rehydrate for second run
  performer = await testHydration(performer);
  // change state for second run
  performer.hasFinished = false;
  let times = performer.root!.hooks["state-0"];
  times.value += 4;
  // second run
  await performer.waitUntilSettled();
  messages = resolveMessages(performer.root, undefined, {
    showResolveMessages: true,
  });
  expect(messages).toHaveLength(5);

  // rehydrate for third run
  performer = await testHydration(performer);
  // change state for third run
  performer.hasFinished = false;
  times = performer.root!.hooks["state-0"];
  times.value -= 2;
  // third run
  await performer.waitUntilSettled();
  messages = resolveMessages(performer.root, undefined, {
    showResolveMessages: true,
  });
  expect(messages).toHaveLength(3);

  // rehydrate for fourth run
  performer = await testHydration(performer);
  // change state for fourth run
  performer.hasFinished = false;
  times = performer.root!.hooks["state-0"];
  times.value -= 1;
  // fourth run
  await performer.waitUntilSettled();
  messages = resolveMessages(performer.root, undefined, {
    showResolveMessages: true,
  });
  expect(messages).toHaveLength(2);
  // final hydration test
  performer = await testHydration(performer);
}, 30_000);

test("should unlink messages when removed by conditional", async () => {
  function Temp({ children }: any) {
    const predicate = useState<boolean>(true);
    return () => (predicate.value ? children : []);
  }
  const app = (
    <Temp>
      <Container>
        <user>Hello, world!</user>
        <Container>
          <user>Goodbye, world!</user>
        </Container>
      </Container>
      <user>Help the user</user>
      <user>What is the population of Australia?</user>
    </Temp>
  );
  const performer = new Performer(app);
  performer.start();
  await performer.waitUntilSettled();
  let messages = resolveMessages(performer.root, undefined, {
    showResolveMessages: true,
  });
  expect(
    messages.length,
    "Expect 4 messages before they are unlinked by `If`",
  ).toEqual(4);

  performer.hasFinished = false;
  const predicate = performer.root!.hooks["state-0"];
  predicate.value = false;

  await performer.waitUntilSettled();
  messages = resolveMessages(performer.root, undefined, {
    showResolveMessages: true,
  });
  expect(
    messages.length,
    "Expect 0 messages after they are unlinked by `If`",
  ).toEqual(0);
  await testHydration(performer);
});

test("should wait for async message actions", async () => {
  async function AsyncMessage() {
    const isReady = useState<boolean>(false);
    await sleep(10);
    isReady.value = true;
    return () => isReady && <system>Your name is Bob</system>;
  }

  const app = (
    <Container>
      <AsyncMessage />
      <assistant>Hi, how can I help?</assistant>
      <user>Hold me close</user>
    </Container>
  );
  const performer = new Performer(app);
  console.time("Render");
  performer.start();
  await performer.waitUntilSettled();
  console.timeEnd("Render");
  const messages = resolveMessages(performer.root);
  expect(messages).toHaveLength(3);
  expect(messages[0]).toEqual({
    role: "system",
    content: "Your name is Bob",
  });
  expect(messages[1]).toEqual({
    role: "assistant",
    content: "Hi, how can I help?",
  });
  expect(messages[2]).toEqual({
    role: "user",
    content: "Hold me close",
  });
  await testHydration(performer);
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
  const performer = new Performer(app);
  performer.start();
  await performer.waitUntilSettled();
  const root = performer.root!;
  expect(root.parent).toBeUndefined();
  expect(root.nextSibling).toBeUndefined();
  expect(root.prevSibling).toBeUndefined();
  const expected = {
    type: "Fragment",
    children: [
      { type: "First", props: { content: "Greet the user" } },
      {
        type: "Second",
        children: [
          { type: "Greet", props: { content: "Hello world" } },
          { type: "Third" },
        ],
      },
    ],
  };
  expectTree(performer.root!, expected);
  expect(root.child?.nextSibling?.nextSibling).toBeUndefined();
  await testHydration(performer);
});

test("should catch sync component that throws", async () => {
  function App() {
    throw Error("Throwing!");
    return () => {};
  }
  const performer = new Performer(<App />, { throwOnError: false });
  performer.start();
  const events: PerformerErrorEvent[] = [];
  performer.addEventListener("error", (event) => {
    events.push(event);
  });
  await performer.waitUntilSettled();
  expect(performer.hasFinished).toEqual(true);
  expect(events).toHaveLength(1);
});

test("should catch async component that throws", async () => {
  async function App() {
    await sleep(10);
    throw Error("Throwing!");
    return () => {};
  }
  const performer = new Performer(<App />, { throwOnError: false });
  performer.start();
  const events: PerformerErrorEvent[] = [];
  performer.addEventListener("error", (event) => {
    events.push(event);
  });
  await performer.waitUntilSettled();
  expect(performer.hasFinished).toEqual(true);
  expect(events).toHaveLength(1);
});
