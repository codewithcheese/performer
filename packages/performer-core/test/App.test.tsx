/* @vitest-environment jsdom */
import { expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Message, Generative, Repeat, System } from "../src/index.js";

it("should call actions depth first", async () => {
  let siblingActioned = false;
  const { findByText } = render(
    <Generative options={{ logLevel: "debug" }}>
      <Message action={() => ({ role: "user", content: "A" })}>
        <Message
          action={() => ({ role: "assistant" as const, content: "B" })}
        />
      </Message>
      <Message
        action={({ messages }) => {
          siblingActioned = true;
          expect(messages).toEqual([
            { role: "user", content: "A" },
            { role: "assistant", content: "B" },
          ]);
        }}
      >
        Done
      </Message>
    </Generative>,
  );
  await findByText("Done");
  expect(siblingActioned).toEqual(true);
});

it("renders correctly", async () => {
  let testActioned = false;
  const TestMessages = () => {
    return (
      <Message
        action={({ messages, signal }) => {
          testActioned = true;
          expect(messages.map((m) => m.content)).toEqual(["1", "2", "1", "2"]);
        }}
      >
        3
      </Message>
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
});
