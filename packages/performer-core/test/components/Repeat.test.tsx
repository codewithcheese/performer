import { assert, expect, test } from "vitest";
import {
  Assistant,
  Repeat,
  resolveMessages,
  Performer,
  useState,
} from "../../src/index.js";
import { testHydration } from "../util/test-hydration.js";

test("should repeat 2 times", async () => {
  const app = (
    <>
      <system>X = 0. Answer with scalar.</system>
      <Repeat times={2}>
        <system>Increment X by 1</system>
        <Assistant />
      </Repeat>
    </>
  );
  const events = [];
  const performer = new Performer({ element: app });
  performer.addEventListener("*", (event) => {
    events.push(event);
  });
  performer.start();
  await performer.waitUntilSettled();
  expect(performer.errors).toHaveLength(0);
  expect(performer.node?.child?.type).toEqual("system");
  assert(performer.node?.child?.nextSibling?.type instanceof Function);
  expect(performer.node?.child?.nextSibling?.type.name).toEqual("Repeat");
  expect(performer.node?.child?.nextSibling?.child?.type).toEqual("system");
  assert(
    performer.node?.child?.nextSibling?.child?.nextSibling?.type instanceof
      Function,
  );
  expect(
    performer.node?.child?.nextSibling?.child?.nextSibling?.type.name,
  ).toEqual("Assistant");
  expect(
    performer.node?.child?.nextSibling?.child?.nextSibling?.nextSibling?.type,
  ).toEqual("system");
  assert(
    performer.node?.child?.nextSibling?.child?.nextSibling?.nextSibling
      ?.nextSibling?.type instanceof Function,
  );
  expect(
    performer.node?.child?.nextSibling?.child?.nextSibling?.nextSibling
      ?.nextSibling?.type.name,
  ).toEqual("Assistant");
  expect(
    performer.node?.child?.nextSibling?.child?.nextSibling?.nextSibling
      ?.nextSibling?.nextSibling,
  ).toEqual(undefined);
  let messages = resolveMessages(performer.node);
  console.log(JSON.stringify(messages, null, 2));
  messages = resolveMessages(performer.node);
  console.log(JSON.stringify(messages, null, 2));
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
  const performer = new Performer({ element: <App /> });
  performer.start();
  await performer.waitUntilSettled();
  const messages = resolveMessages(performer.node);
  expect(messages.length).toEqual(5);
  await testHydration(performer);
}, 10_000);
