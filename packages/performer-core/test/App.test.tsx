/* @vitest-environment jsdom */
import { expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Repeat, System } from "../src/index.js";
import { Generative } from "../src/components/Generative.js";
import { Action } from "../src/components/Action.js";

it("should call actions depth first", async () => {
  let siblingActioned = false;
  const { findByText } = render(
    <Generative options={{ logLevel: "debug" }}>
      <Action action={() => ({ role: "user", content: "A" })}>
        <Action action={() => ({ role: "assistant" as const, content: "B" })} />
      </Action>
      <Action
        action={({ messages }) => {
          siblingActioned = true;
          expect(messages).toEqual([
            { role: "user", content: "A" },
            { role: "assistant", content: "B" },
          ]);
        }}
      >
        Done
      </Action>
    </Generative>,
  );
  await findByText("Done");
  expect(siblingActioned).toEqual(true);
});

it("renders correctly", async () => {
  let testActioned = false;
  const TestMessages = () => {
    return (
      <Action
        action={({ messages, signal }) => {
          testActioned = true;
          expect(messages.map((m) => m.content)).toEqual(["1", "2", "1", "2"]);
        }}
      >
        3
      </Action>
    );
  };

  const { findByText } = render(
    <Generative options={{ logLevel: "debug" }}>
      <Repeat limit={2}>
        <System content="1">1</System>
        <System content="2">2</System>
      </Repeat>
      <TestMessages />
    </Generative>,
  );
  await findByText("3");
  expect(testActioned).toEqual(true);
}, 20_000);
