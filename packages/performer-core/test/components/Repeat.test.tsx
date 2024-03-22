import { expect, test } from "vitest";
import {
  Performer,
  Repeat,
  resolveMessages,
  useResource,
  useState,
} from "../../src/index.js";
import { testHydration } from "../util/test-hydration.js";
import { sleep } from "openai/core";

function Async({ children }: any) {
  useResource(sleep, 5);
  return () => children;
}

test("should repeat until times prop is reached", async () => {
  const app = (
    <>
      <system>0</system>
      <Repeat times={1}>
        <system>A</system>
        <assistant>B</assistant>
        <Async>
          <user>C</user>
        </Async>
      </Repeat>
      <Repeat times={2}>
        <system>D</system>
        <assistant>E</assistant>
        <Async>
          <user>F</user>
        </Async>
      </Repeat>
    </>
  );
  const performer = new Performer(app);
  performer.start();
  await performer.waitUntilSettled();
  let messages = resolveMessages(performer.root);
  expect(messages).toHaveLength(1 + 1 * 3 + 2 * 3);
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
        <system>0</system>
        <Repeat stop={stop}>
          <system onMessage={onMessage}>A</system>
          <assistant>B</assistant>
          <Async>
            <user>C</user>
          </Async>
        </Repeat>
      </>
    );
  }
  const performer = new Performer(<App />);
  performer.start();
  await performer.waitUntilSettled();
  const messages = resolveMessages(performer.root);
  expect(messages.length).toEqual(1 + 3 * 4);
  await testHydration(performer);
}, 10_000);
