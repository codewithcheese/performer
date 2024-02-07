import { assert, expect, test } from "vitest";
import {
  Assistant,
  Repeat,
  resolveMessages,
  Performer,
  useState,
} from "../../src/index.js";
import { testHydration } from "../util/test-hydration.js";
import { ExpectNode, expectTree } from "../util/expect-tree.js";

test("should repeat multiple times", async () => {
  const app = (
    <>
      <system>X = 0. Answer using scalar value only.</system>
      <Repeat times={2}>
        <system>Increment X by 1</system>
        <Assistant />
      </Repeat>
      <Repeat times={2}>
        <system>Increment X by 2</system>
        <Assistant />
      </Repeat>
    </>
  );
  const events = [];
  const performer = new Performer(app);
  performer.addEventListener("*", (event) => {
    events.push(event);
  });
  performer.start();
  await performer.waitUntilSettled();
  expect(performer.errors).toHaveLength(0);
  expectTree(performer.root!, {
    type: "Fragment",
    children: [
      { type: "system" },
      {
        type: "Repeat",
        children: [
          { type: "system" },
          { type: "Assistant" },
          { type: "system" },
          { type: "Assistant" },
        ],
      },
      {
        type: "Repeat",
        children: [
          { type: "system" },
          { type: "Assistant" },
          { type: "system" },
          { type: "Assistant" },
        ],
      },
    ],
  });
  let messages = resolveMessages(performer.root);
  expect(messages).toHaveLength(11);
  await testHydration(performer);
}, 30_000);

test("should stop repeating using stop prop", async () => {
  function App() {
    let count = 0; // no signal needed not used in view
    const stop = useState<boolean>(false);
    const onMessage = () => {
      count += 1;
      if (count >= 4) {
        stop.value = true;
      }
    };
    return () => (
      <>
        <system>X = 0. Answer with scalar.</system>
        <Repeat stop={stop}>
          <system onMessage={onMessage}>Increment X by 1</system>
          <Assistant onMessage={onMessage} />
        </Repeat>
      </>
    );
  }
  const performer = new Performer(<App />);
  performer.start();
  await performer.waitUntilSettled();
  const messages = resolveMessages(performer.root);
  expect(messages.length).toEqual(5);
  await testHydration(performer);
}, 10_000);
