import { expect, test } from "vitest";
import { Performer, UseResourceHook } from "../../src/index.js";

test("useResource should retain state across async contexts", async () => {
  async function App({}, { useResource }: { useResource: UseResourceHook }) {
    const c42 = await useResource(() => Promise.resolve(42));
    const c420 = await useResource(() => Promise.resolve(420));
    const c1337 = await useResource(() => Promise.resolve(1337));
    return () => (
      <>
        <system>{`${c42}`}</system>
        <system>{`${c420}`}</system>
        <system>{`${c1337}`}</system>
      </>
    );
  }
  const performer = new Performer({ element: <App /> });
  performer.start();
  await performer.waitUntilSettled();
  expect(performer.node?.hooks["resource-0"]).toEqual({
    type: "value",
    value: 42,
  });
  expect(performer.node?.hooks["resource-1"]).toEqual({
    type: "value",
    value: 420,
  });
  expect(performer.node?.hooks["resource-2"]).toEqual({
    type: "value",
    value: 1337,
  });
  expect(performer.node?.child?.child?.type).toEqual("system");
  expect(performer.node?.child?.child?.props?.content).toEqual("42");
});

// todo: test correctly rehydrates stream
