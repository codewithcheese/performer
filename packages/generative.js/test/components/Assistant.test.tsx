/* @vitest-environment jsdom */
import { afterEach, assert, expect, test, vi } from "vitest";
import {
  Assistant,
  createTool,
  GenerativeProvider,
  GenerativeContext,
  Message,
  Generative,
  GenerativeMessage,
  readTextContent,
  System,
  User,
} from "../../src/index.js";
import { render } from "@testing-library/react";
import { sleep } from "openai/core";
import "dotenv/config";
import { useCallback, useContext } from "react";
import { z } from "zod";
import { ErrorBoundary } from "../util/ErrorBoundary.js";
import { getGenerative, UseGenerative } from "../util/UseGenerative.js";

test("should call model with messages", async () => {
  let done = false;
  const app = (
    <GenerativeProvider>
      <UseGenerative />
      <System content="JSON true value" />
      <Assistant requestOptions={{ response_format: { type: "json_object" } }}>
        <Message
          type={({ messages }) => {
            done = true;
            expect(messages).toHaveLength(2);
            expect(messages[0].role).toEqual("system");
            expect(messages[1].role).toEqual("assistant");
          }}
        >
          Done
        </Message>
      </Assistant>
    </GenerativeProvider>
  );
  const { findByText } = render(app);
  await getGenerative()!.waitUntilSettled();
  await findByText("Done");
  expect(done).toEqual(true);
}, 10_000);

test("should use tool", async () => {
  const tool = createTool("answer", z.object({ answer: z.boolean() }));
  const app = (
    <GenerativeProvider>
      <UseGenerative />
      <System content="1+1. Scalar only, no preamble." />
      <Assistant tools={[tool]} toolChoice={tool} />
    </GenerativeProvider>
  );
  const {} = render(app);
  const generative = getGenerative();
  await generative!.waitUntilSettled();
  const messages = generative!.getAllMessages();
  expect(messages).toHaveLength(2);
  assert(messages[1].role === "assistant");
  expect(messages[1].tool_calls).toHaveLength(1);
});

test("should bubble error when apiKey invalid", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  try {
    const app = (
      <GenerativeProvider>
        <UseGenerative />
        <ErrorBoundary>
          <System content="The answer is 42. Be concise." />
          <User content="What is the answer?" />
          <Assistant clientOptions={{ apiKey: "deadbeef" }} />
        </ErrorBoundary>
      </GenerativeProvider>
    );
    const { container } = render(app);
    const generative = getGenerative()!;
    await generative.waitUntilSettled();
    const errorDiv = container.querySelector("div");
    expect(errorDiv?.textContent).toContain("Incorrect API key provided");
  } finally {
    // @ts-expect-error TS not aware of mock
    console.error.mockRestore();
  }
}, 10_000);

test("should abort assistant response");
