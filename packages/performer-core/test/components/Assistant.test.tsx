/* @vitest-environment jsdom */
import { afterEach, assert, expect, test, vi } from "vitest";
import {
  Assistant,
  createTool,
  Generative,
  GenerativeContext,
  Message,
  Performer,
  PerformerMessage,
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
import { getPerformer, UsePerformer } from "../util/UsePerformer.js";

test("should call model with messages", async () => {
  let done = false;
  const app = (
    <Generative>
      <UsePerformer />
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
    </Generative>
  );
  const { findByText } = render(app);
  await getPerformer()!.waitUntilSettled();
  await findByText("Done");
  expect(done).toEqual(true);
}, 10_000);

test("should use tool", async () => {
  const tool = createTool("answer", z.object({ answer: z.boolean() }));
  const app = (
    <Generative>
      <UsePerformer />
      <System content="1+1. Scalar only, no preamble." />
      <Assistant tools={[tool]} toolChoice={tool} />
    </Generative>
  );
  const {} = render(app);
  const performer = getPerformer();
  await performer!.waitUntilSettled();
  const messages = performer!.getAllMessages();
  expect(messages).toHaveLength(2);
  assert(messages[1].role === "assistant");
  expect(messages[1].tool_calls).toHaveLength(1);
});

test("should bubble error when apiKey invalid", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  try {
    const app = (
      <Generative>
        <UsePerformer />
        <ErrorBoundary>
          <System content="The answer is 42. Be concise." />
          <User content="What is the answer?" />
          <Assistant clientOptions={{ apiKey: "deadbeef" }} />
        </ErrorBoundary>
      </Generative>
    );
    const { container } = render(app);
    const performer = getPerformer()!;
    await performer.waitUntilSettled();
    const errorDiv = container.querySelector("div");
    expect(errorDiv?.textContent).toContain("Incorrect API key provided");
  } finally {
    // @ts-expect-error TS not aware of mock
    console.error.mockRestore();
  }
}, 10_000);

test("should abort assistant response");
