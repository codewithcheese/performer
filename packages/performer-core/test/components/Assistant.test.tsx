import { assert, expect, test } from "vitest";
import {
  Assistant,
  createTool,
  isMessage,
  Performer,
  resolveMessages,
  useMessages,
  useState,
} from "../../src/index.js";
import "dotenv/config";
import { testHydration } from "../util/test-hydration.js";
import { z } from "zod";
import { createLookup } from "../util/lookup-node.js";
import { sleep } from "openai/core";

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
  const lookup = createLookup(performer.root!);

  expect(lookup("system").type).toEqual("system");
  expect(lookup("system").props.children).toEqual(
    "Hello world in Javascript. Code only.",
  );
  const assistant = lookup("Assistant");
  assert(assistant.type instanceof Function);
  expect(assistant.type.name).toEqual("Assistant");

  const fragment = lookup("Assistant->Fragment");
  assert(fragment.type instanceof Function);
  expect(fragment.type.name).toEqual("Fragment");

  const raw = lookup("Assistant->Fragment->raw");
  expect(raw.type).toEqual("raw");
  expect(
    raw.hooks.message,
    "Expect raw element message hook to be defined.",
  ).toBeDefined();
  assert(isMessage(raw.hooks?.message));
  expect(raw.hooks?.message.role).toEqual("assistant");
  expect(raw.hooks?.message.content).not.toBeNull();
  testHydration(performer);
}, 10_000);

test("should call onMessage event handler after assistant response", async () => {
  function App() {
    const received = useState(false);
    return () => (
      <>
        <system>1+1. Scalar only, no preamble.</system>
        <Assistant onMessage={() => (received.value = true)} />
        {received && <user>Thank you</user>}
      </>
    );
  }
  const performer = new Performer(<App />);
  performer.start();
  await performer.waitUntilSettled();
  const messages = performer.getAllMessages();
  expect(messages).toHaveLength(3);
  expect(messages[2]).toEqual({ role: "user", content: "Thank you" });
  const hydratedPerformer = await testHydration(performer);
  const hydratedMessages = hydratedPerformer.getAllMessages();
  expect(hydratedMessages).toHaveLength(3);
});

test("should include tool message before resolving", async () => {
  const tool = createTool(
    "answer",
    z.object({ answer: z.boolean() }),
    () => {},
  );
  // expect that tool message is available immediately after Assistant resolves
  function CheckForToolMessage() {
    const messages = useMessages();
    expect(messages).toHaveLength(3);
    return () => {};
  }
  const app = (
    <>
      <system>1+1. Scalar only, no preamble.</system>
      <Assistant tools={[tool]} toolChoice={tool} />
      <CheckForToolMessage />
    </>
  );
  const performer = new Performer(app);
  performer.start();
  await performer.waitUntilSettled();
  testHydration(performer);
});

test("should emit error event when apiKey is incorrect", async () => {
  function App() {
    return () => (
      <>
        <system>The answer is 42. Be concise.</system>
        <user>What is the answer?</user>
        <Assistant apiKey="deadbeef" />
      </>
    );
  }
  const performer = new Performer(<App />, { throwOnError: false });
  let hasErrorEvent = false;
  performer.addEventListener("error", () => {
    hasErrorEvent = true;
  });

  process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
    // Handle the error appropriately
  });

  process.setUncaughtExceptionCaptureCallback((err) => {
    console.error(err);
  });

  performer.start();
  await performer.waitUntilSettled();
  expect(hasErrorEvent, "Expected error").toEqual(true);
}, 10_000);

test.skipIf(!process.env.OPENROUTER_API_KEY)(
  "should use open router",

  async () => {
    function Mixtral(props: any) {
      return Assistant({
        model: "mistralai/mixtral-8x7b-instruct",
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: process.env.OPENROUTER_API_KEY,
        ...props,
      });
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

test.skipIf(!process.env.PERPLEXITY_API_KEY)(
  "should use perplexity",

  async () => {
    function Perplexity(props: any) {
      return Assistant({
        model: "sonar-medium-online",
        baseURL: "https://api.perplexity.ai",
        apiKey: process.env.PERPLEXITY_API_KEY,
        ...props,
      });
    }

    function App() {
      return () => (
        <>
          <user>Has GPT-5 been released yet</user>
          <Perplexity />
        </>
      );
    }
    const performer = new Performer(<App />);
    performer.start();
    await performer.waitUntilSettled();
    const messages = performer.getAllMessages();
    expect(messages).toHaveLength(2);
    expect(messages[0].role).toEqual("user");
    expect(messages[1].role).toEqual("assistant");
  },
  20_000,
);

test.skipIf(process.env.USE_OLLAMA !== "true")(
  "should use ollama model",

  async () => {
    function Ollama({ model }: { model: string }) {
      return Assistant({
        model,
        baseURL: "http://localhost:11434/v1",
      });
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
