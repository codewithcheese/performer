import { test, expect, assert } from "vitest";
import { Performer, useAfterChildren, useState } from "../../src/index.js";

test("should run once only if callback does not cause child rerender", async () => {
  function AfterChildren() {
    const count = useState(0);
    useAfterChildren(() => {
      count.value += 1;
    });
    return () => {
      return <system>Be funny!</system>;
    };
  }
  function App() {
    return () => (
      <>
        <AfterChildren />
        <AfterChildren />
      </>
    );
  }
  const performer = new Performer(<App />);
  performer.start();
  await performer.waitUntilSettled();
  expect(performer.root?.child?.child?.hooks["state-0"].value).toEqual(1);
  expect(
    performer.root?.child?.child?.nextSibling?.hooks["state-0"].value,
  ).toEqual(1);
});

test("should re-run if callback causes child rerender", async () => {
  function AfterChildren() {
    const count = useState(0);
    useAfterChildren(() => {
      if (count.value < 3) {
        count.value += 1;
      }
    });
    return () => {
      return <system>Be funny X{String(count)}!</system>;
    };
  }
  function App() {
    return () => (
      <>
        <AfterChildren id="1" />
        <AfterChildren id="2" />
      </>
    );
  }
  const performer = new Performer(<App />);
  performer.start();
  await performer.waitUntilSettled();
  expect(performer.root?.child?.child?.hooks["state-0"].value).toEqual(3);
  expect(
    performer.root?.child?.child?.nextSibling?.hooks["state-0"].value,
  ).toEqual(3);
});

// todo: needs more thought. A child op is required otherwise useAfterChildren will be triggered on every render
// test("should trigger callback when children empty array", async () => {
//   function App() {
//     const called = useState(false);
//     useAfterChildren(() => {
//       called.value = true;
//     });
//     return () => [];
//   }
//   const performer = new Performer(<App />);
//   performer.start();
//   await performer.waitUntilSettled();
//   expect(performer.root?.hooks["state-0"].value).toEqual(true);
// });
