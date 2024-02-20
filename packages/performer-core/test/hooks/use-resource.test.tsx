import { expect, test } from "vitest";
import {
  AsyncHooks,
  MessageDelta,
  Performer,
  resolveMessages,
  UseResourceHook,
  UserMessage,
} from "../../src/index.js";

test("should retain state across async contexts", async () => {
  async function App({}, { useResource }: AsyncHooks) {
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
  const performer = new Performer(<App />);
  performer.start();
  await performer.waitUntilSettled();
  expect(performer.root?.hooks["resource-0"]).toEqual({
    type: "value",
    value: 42,
  });
  expect(performer.root?.hooks["resource-1"]).toEqual({
    type: "value",
    value: 420,
  });
  expect(performer.root?.hooks["resource-2"]).toEqual({
    type: "value",
    value: 1337,
  });
  expect(performer.root?.child?.child?.type).toEqual("system");
  expect(performer.root?.child?.child?.props?.children).toEqual("42");
});

test("should write stream chunks to hook state", async () => {
  const userMessage = {
    role: "user" as const,
    content: "Hello World",
  };

  function fetcher() {
    return new ReadableStream<MessageDelta>({
      start(controller) {
        controller.enqueue(userMessage);
        controller.close();
      },
    });
  }

  async function App({}, { useResource }: AsyncHooks) {
    const stream = await useResource(fetcher);
    return () => <raw stream={stream} />;
  }

  const performer = new Performer(<App />);
  performer.start();
  await performer.waitUntilSettled();
  expect(performer.root?.child?.type).toEqual("raw");
  expect(performer.root?.hooks["resource-0"]).toEqual({
    type: "stream",
    chunks: [userMessage],
  });
  const messages = resolveMessages(performer.root);
  expect(messages[0]).toEqual(userMessage);
});

test("should pass additional arguments", async () => {
  let args: any[] = [];
  function three() {}
  async function App({}, { useResource }: AsyncHooks) {
    await useResource((_, ...rest) => args.push(...rest), 1, "2", three);
    return () => {};
  }
  const performer = new Performer(<App />);
  performer.start();
  await performer.waitUntilSettled();
  expect(args).toEqual([1, "2", three]);
});
