import { expect, test, assert, assertType } from "vitest";
import {
  createContext,
  useContextProvider,
  Performer,
  useContext,
} from "../../src/index.js";
import { Signal } from "@preact/signals-core";

test("should use context from provider", async () => {
  const firstContextId = createContext<string>("first");
  const secondContextId = createContext<string>("second");
  function Provider(props: any) {
    useContextProvider(firstContextId, "Hello world");
    useContextProvider(secondContextId, "Good night");
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
  const performer = new Performer(app);
  performer.start();
  await performer.waitUntilFinished();
  expect(performer.root?.action).toEqual(Provider);
  expect(
    (performer.root?.hooks["context-first"] as Signal<string>).value,
  ).toEqual("Hello world");
  expect(
    (performer.root?.hooks["context-second"] as Signal<string>).value,
  ).toEqual("Good night");
  expect(performer.root?.child?.action).toEqual(Consumer);
  expect(performer.root?.child?.hooks["provider-first"]?.type).toEqual(
    Provider,
  );
  expect(performer.root?.child?.hooks["provider-second"]?.type).toEqual(
    Provider,
  );
});

test("should throw with invalid name", () => {
  expect(() => createContext("My Context")).toThrow();
});

test("should not throw with valid name", () => {
  expect(() => createContext("My-Context")).not.toThrow();
});
