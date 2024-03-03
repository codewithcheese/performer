import { expect, test } from "vitest";
import {
  Performer,
  PerformerNode,
  useMessages,
  useResource,
  useState,
  Thread,
} from "../src/index.js";
import { sleep } from "../src/util/sleep.js";
import { walk } from "../src/util/walk.js";

test("should resolve different threads concurrently, same thread in serial", async () => {
  const order: string[] = [];
  function Slow({ children }: any) {
    useResource(() => sleep(10));
    order.push(children);
    return () => {};
  }
  function App() {
    return () => (
      <>
        <Thread>
          <Slow>A1</Slow>
          <Slow>B1</Slow>
          <Thread>
            <Slow>C1</Slow>
          </Thread>
        </Thread>
        <Thread>
          <Slow>A2</Slow>
          <Slow>B2</Slow>
          <Thread>
            <Slow>C2</Slow>
          </Thread>
        </Thread>
        <Slow>A3</Slow>
        <Slow>B3</Slow>
        <Thread>
          <Slow>C3</Slow>
        </Thread>
      </>
    );
  }

  const performer = new Performer(<App />);
  performer.start();
  await performer.waitUntilSettled();
  expect(order).toEqual(["A1", "A2", "A3", "B1", "B2", "B3", "C1", "C2", "C3"]);
});

test("should exclude messages from sub-threads", async () => {
  function Expect({ expected }: { expected: string[] }) {
    const messages = useMessages();
    expect(messages.map((m) => m.content)).toEqual(expected);
    return () => {};
  }
  function Container({ children }: any) {
    return () => <>{children}</>;
  }
  const root = "root";
  const thread0 = "root/0";
  const thread01 = "root/0/1";
  const thread2 = "root/2";
  function App() {
    return () => (
      <>
        <user>{root}</user>
        <Thread>
          <user>{thread0}</user>
          <Expect expected={[root, thread0]} />
          <Thread>
            <user>{thread01}</user>
            <Expect expected={[root, thread0, thread01]} />
          </Thread>
          <user>{thread0}</user>
          <Expect expected={[root, thread0, thread0]} />
        </Thread>
        <Container>
          <user>{root}</user>
        </Container>
        <Thread>
          <user>{thread2}</user>
          <Expect expected={[root, root, thread2]} />
        </Thread>
        <Expect expected={[root, root]} />
      </>
    );
  }
  const performer = new Performer(<App />);
  performer.start();
  await performer.waitUntilSettled();
  // get `users` nodes and verify their content matches their thread
  const users: PerformerNode[] = [];
  walk(performer.root!, (node) =>
    node.type === "user" ? !!users.push(node) : false,
  );
  users.forEach((user) => expect(user.props.children).toEqual(user.thread));
});

test("should call onSettled when thread children rendered", async () => {
  function App() {
    const hasSettled = useState(false);
    return () => (
      <Thread onSettled={() => (hasSettled.value = true)}>
        <user>Hello world</user>
      </Thread>
    );
  }
  const performer = new Performer(<App />);
  performer.start();
  await performer.waitUntilSettled();
  expect(performer.root?.hooks["state-0"].value).toEqual(true);
});

test("should await all thread before continuing", async () => {
  const order: string[] = [];
  const settledOrder: number[] = [];
  function Fast({ children }: any) {
    order.push(children);
    return () => {};
  }
  function Slow({ children }: any) {
    useResource(() => sleep(10));
    order.push(children);
    return () => {};
  }
  function Container({ children }: any) {
    return () => <>{children}</>;
  }
  function App() {
    return () => (
      <>
        <Slow>first</Slow>
        <Thread.AwaitAll>
          <Thread onSettled={() => settledOrder.push(3)}>
            <Slow>3</Slow>
            <Slow>6</Slow>
          </Thread>
          <Thread onSettled={() => settledOrder.push(1)}>
            <Slow>4</Slow>
          </Thread>
          <Thread onSettled={() => settledOrder.push(2)}>
            <Slow>5</Slow>
          </Thread>
          <Container>
            <Fast>2</Fast>
          </Container>
        </Thread.AwaitAll>
        <Slow>second last</Slow>
        <Fast>last</Fast>
      </>
    );
  }
  const performer = new Performer(<App />);
  performer.start();
  await performer.waitUntilSettled();
  expect(order).toEqual([
    "first",
    "2",
    "3",
    "4",
    "5",
    "6",
    "second last",
    "last",
  ]);
  expect(settledOrder).toEqual([1, 2, 3]);
});
