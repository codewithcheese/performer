import { expect, test } from "vitest";
import {
  Performer,
  PerformerNode,
  useMessages,
  useResource,
  useState,
  Worker,
} from "../src/index.js";
import { sleep } from "../src/util/sleep.js";
import { walk } from "../src/util/walk.js";

test("should resolve different workers concurrently, same worker in serial", async () => {
  const order: string[] = [];
  function Slow({ children }: any) {
    useResource(() => sleep(10));
    order.push(children);
    return () => {};
  }
  function App() {
    return () => (
      <>
        <Worker>
          <Slow>A1</Slow>
          <Slow>B1</Slow>
          <Worker>
            <Slow>C1</Slow>
          </Worker>
        </Worker>
        <Worker>
          <Slow>A2</Slow>
          <Slow>B2</Slow>
          <Worker>
            <Slow>C2</Slow>
          </Worker>
        </Worker>
        <Slow>A3</Slow>
        <Slow>B3</Slow>
        <Worker>
          <Slow>C3</Slow>
        </Worker>
      </>
    );
  }

  const performer = new Performer(<App />);
  performer.start();
  await performer.waitUntilSettled();
  expect(order).toEqual(["A1", "A2", "A3", "B1", "B2", "B3", "C1", "C2", "C3"]);
});

test("should exclude messages from sub-workers", async () => {
  function Expect({ expected }: { expected: string[] }) {
    const messages = useMessages();
    expect(messages.map((m) => m.content)).toEqual(expected);
    return () => {};
  }
  function Container({ children }: any) {
    return () => <>{children}</>;
  }
  const root = "root";
  const worker0 = "root/0";
  const worker01 = "root/0/1";
  const worker2 = "root/2";
  function App() {
    return () => (
      <>
        <user>{root}</user>
        <Worker>
          <user>{worker0}</user>
          <Expect expected={[root, worker0]} />
          <Worker>
            <user>{worker01}</user>
            <Expect expected={[root, worker0, worker01]} />
          </Worker>
          <user>{worker0}</user>
          <Expect expected={[root, worker0, worker0]} />
        </Worker>
        <Container>
          <user>{root}</user>
        </Container>
        <Worker>
          <user>{worker2}</user>
          <Expect expected={[root, root, worker2]} />
        </Worker>
        <Expect expected={[root, root]} />
      </>
    );
  }
  const performer = new Performer(<App />);
  performer.start();
  await performer.waitUntilSettled();
  // get users nodes and verify that their content matches their worker
  const users: PerformerNode[] = [];
  walk(performer.root!, (node) =>
    node.type === "user" ? !!users.push(node) : false,
  );
  users.forEach((user) => expect(user.props.children).toEqual(user.worker));
});

test("should call onSettled when worker children rendered", async () => {
  function App() {
    const hasSettled = useState(false);
    return () => (
      <Worker onSettled={() => (hasSettled.value = true)}>
        <user>Hello world</user>
      </Worker>
    );
  }
  const performer = new Performer(<App />);
  performer.start();
  await performer.waitUntilSettled();
  expect(performer.root?.hooks["state-0"].value).toEqual(true);
});

test("should await all workers before continuing", async () => {
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
        <Worker.AwaitAll>
          <Worker onSettled={() => settledOrder.push(3)}>
            <Slow>3</Slow>
            <Slow>6</Slow>
          </Worker>
          <Worker onSettled={() => settledOrder.push(1)}>
            <Slow>4</Slow>
          </Worker>
          <Worker onSettled={() => settledOrder.push(2)}>
            <Slow>5</Slow>
          </Worker>
          <Container>
            <Fast>2</Fast>
          </Container>
        </Worker.AwaitAll>
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
