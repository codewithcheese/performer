import { assert, expect, test } from "vitest";
import {
  Assistant,
  AsyncHooks,
  isMessage,
  Performer,
  resolveMessages,
} from "../../src/index.js";
import "dotenv/config";

test("should call model with messages", async () => {
  const app = (
    <>
      <system>Hello world in Javascript. Code only.</system>
      <Assistant />
    </>
  );
  const performer = new Performer(app);
  performer.start();
  await performer.waitUntilSettled();
  expect(performer.root?.child?.type).toEqual("system");
  expect(performer.root?.child?.props.content).toEqual(
    "Hello world in Javascript. Code only.",
  );
  assert(performer.root?.child?.nextSibling?.type instanceof Function);
  expect(performer.root?.child?.nextSibling?.type.name).toEqual("Assistant");
  assert(performer.root?.child?.nextSibling?.child?.type instanceof Function);
  expect(performer.root?.child?.nextSibling?.child?.type.name).toEqual(
    "Fragment",
  );
  expect(performer.root?.child?.nextSibling?.child?.child?.type).toEqual("raw");
  expect(
    performer.root?.child?.nextSibling?.child?.child?.hooks.message,
    "Expect raw element message hook to be defined.",
  ).toBeDefined();
  assert(
    isMessage(performer.root?.child?.nextSibling?.child?.child?.hooks?.message),
  );
  expect(
    performer.root?.child?.nextSibling?.child?.child?.hooks?.message.role,
  ).toEqual("assistant");
  expect(
    performer.root?.child?.nextSibling?.child?.child?.hooks?.message.content,
  ).not.toBeNull();
}, 10_000);

test("should call onMessage event handler after assistant response", async () => {
  let eventHandlerCalled = false;
  const app = (
    <>
      <system>1+1. Scalar only, no preamble.</system>
      <Assistant onMessage={() => (eventHandlerCalled = true)} />
    </>
  );
  const performer = new Performer(app);
  performer.start();
  await performer.waitUntilSettled();
  expect(eventHandlerCalled).toEqual(true);
});

test.skipIf(!process.env.OPENROUTER_API_KEY)(
  "should use open router",

  async () => {
    function Mixtral({}, asyncHooks: AsyncHooks) {
      return Assistant(
        {
          model: "mistralai/mixtral-8x7b-instruct",
          baseURL: "https://openrouter.ai/api/v1",
          apiKey: process.env.OPENROUTER_API_KEY,
        },
        asyncHooks,
      );
    }

    function App() {
      return () => (
        <>
          <system>Your name is Bob.</system>
          <user>Whats your name?</user>
          <Mixtral />
        </>
      );
    }
    const performer = new Performer(<App />);
    performer.start();
    await performer.waitUntilSettled();
    const message = resolveMessages(performer.root!);
    console.log(message);
  },
  20_000,
);

test.skipIf(process.env.USE_OLLAMA !== "true")(
  "should use ollama model",

  async () => {
    function Ollama({ model }: { model: string }, asyncHooks: AsyncHooks) {
      return Assistant(
        {
          model,
          baseURL: "http://localhost:11434/v1",
        },
        asyncHooks,
      );
    }

    function App() {
      return () => (
        <>
          <system>Your name is Bob.</system>
          <user>Whats your name? Be concise.</user>
          <Ollama model="phi" />
        </>
      );
    }
    const performer = new Performer(<App />);
    performer.start();
    await performer.waitUntilSettled();
    const message = resolveMessages(performer.root!);
    console.log(message);
  },
  20_000,
);
