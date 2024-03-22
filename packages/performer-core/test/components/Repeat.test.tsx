import { expect, test } from "vitest";
import {
  Performer,
  PerformerMessage,
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

test("should support nested repeat", async () => {
  const app = (
    <>
      <system>-1</system>
      <Repeat times={2}>
        <system>0</system>
        <Repeat times={3}>
          <Async>
            <user>1</user>
            <Repeat times={4}>
              <Async>
                <user>2</user>
              </Async>
            </Repeat>
          </Async>
        </Repeat>
        <assistant>3</assistant>
      </Repeat>
      <system>4</system>
    </>
  );
  const performer = new Performer(app);
  let eventMessages: PerformerMessage[] = [];
  performer.addEventListener("message", (event) =>
    eventMessages.push(event.detail.message),
  );
  performer.start();
  await performer.waitUntilSettled();
  let messages = performer.getAllMessages();
  // compare order of events (render order) with order of messages (tree order)
  expect(messages).toEqual(eventMessages);
  const countOccurrence = (list: PerformerMessage[], content: string) =>
    list.filter((m) => m.content === content).length;
  expect(countOccurrence(messages, "-1")).toEqual(1);
  expect(countOccurrence(messages, "0")).toEqual(2);
  expect(countOccurrence(messages, "1")).toEqual(2 * 3);
  expect(countOccurrence(messages, "2")).toEqual(2 * 3 * 4);
  expect(countOccurrence(messages, "3")).toEqual(2);
  expect(countOccurrence(messages, "4")).toEqual(1);
}, 30_000);

test("node after repeat should not render until repeat is complete", async () => {
  const app = (
    <>
      <Repeat times={2}>
        <system>A</system>
      </Repeat>
      <system>1</system>
    </>
  );
  const performer = new Performer(app);
  let eventMessages: PerformerMessage[] = [];
  performer.addEventListener("message", (event) =>
    eventMessages.push(event.detail.message),
  );
  performer.start();
  await performer.waitUntilSettled();
  let messages = performer.getAllMessages();
  // compare order of events (render order) with order of messages (tree order)
  expect(messages).toEqual(eventMessages);
}, 30_000);

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
      <system>1</system>
      <Repeat times={2}>
        <system>D</system>
        <assistant>E</assistant>
        <Async>
          <user>F</user>
        </Async>
      </Repeat>
      <system>2</system>
    </>
  );
  const performer = new Performer(app);
  performer.start();
  await performer.waitUntilSettled();
  let messages = resolveMessages(performer.root);
  expect(messages).toHaveLength(1 + 1 * 3 + 1 + 2 * 3 + 1);
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
        <system>1</system>
        <user>2</user>
      </>
    );
  }
  const performer = new Performer(<App />);
  performer.start();
  await performer.waitUntilSettled();
  const messages = resolveMessages(performer.root);
  expect(messages.length).toEqual(1 + 3 * 4 + 2);
  await testHydration(performer);
}, 10_000);
