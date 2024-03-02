import { assert, expect, test } from "vitest";
import {
  Assistant,
  Component,
  createTool,
  Performer,
  useResource,
  useWorker,
} from "../src/index.js";
import { sleep } from "../src/util/sleep.js";
import { z } from "zod";
import { transformerToNodeTree } from "./util/node-tree.js";
import { createLookup } from "./util/lookup-node.js";

const Worker: Component<{}> = function ({ children }) {
  useWorker();
  return () => children;
};

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
        <user>What is 1 + 1</user>
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

test("should run assistant concurrently", async () => {
  const sumTool = createTool("sum", z.object({ sum: z.number() }));

  function App() {
    return () => (
      <>
        <user>What is 1 + 1</user>
        <Worker>
          <Assistant toolChoice={sumTool} tools={[sumTool]} />
        </Worker>
        <Assistant toolChoice={sumTool} tools={[sumTool]} />
      </>
    );
  }

  const performer = new Performer(<App />);
  performer.start();
  await performer.waitUntilSettled();
});
