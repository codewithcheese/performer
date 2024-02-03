import { expect, test, assert, assertType } from "vitest";
import {
  createContextId,
  initContext,
  Performer,
  useContext,
} from "../../src/index.js";
import { Signal } from "@preact/signals-core";

test("should use context from provider", async () => {
  const firstContextId = createContextId<string>("first");
  const secondContextId = createContextId<string>("second");
  function Provider(props: any) {
    initContext(firstContextId, "Hello world");
    initContext(secondContextId, "Good night");
    return () => props.children;
  }
  function Consumer(props: any) {
    const second = useContext(secondContextId);
    const first = useContext(firstContextId);
    expect(second.value).toEqual("Good night");
    expect(first.value).toEqual("Hello world");
    return () => props.children;
  }

  const app = (
    <Provider>
      <Consumer />
    </Provider>
  );
  const performer = new Performer({ element: app });
  performer.start();
  await performer.waitUntilSettled();
  expect(performer.node?.type).toEqual(Provider);
  expect(
    (performer.node?.hooks["context-first"] as Signal<string>).value,
  ).toEqual("Hello world");
  expect(
    (performer.node?.hooks["context-second"] as Signal<string>).value,
  ).toEqual("Good night");
  expect(performer.node?.child?.type).toEqual(Consumer);
  expect(performer.node?.child?.hooks["provider-first"]?.type).toEqual(
    Provider,
  );
  expect(performer.node?.child?.hooks["provider-second"]?.type).toEqual(
    Provider,
  );
});
