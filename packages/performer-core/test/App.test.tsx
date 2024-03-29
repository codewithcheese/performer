/* @vitest-environment jsdom */
import { expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Repeat, System } from "../src/index.js";
import { GenerativeProvider } from "../src/components/GenerativeProvider.js";
import { Generative } from "../src/components/Generative.js";

it("should call actions depth first", async () => {
  let siblingActioned = false;
  const { findByText } = render(
    <GenerativeProvider options={{ logLevel: "debug" }}>
      <Generative action={() => ({ role: "user", content: "A" })}>
        <Generative
          action={() => ({ role: "assistant" as const, content: "B" })}
        />
      </Generative>
      <Generative
        action={({ messages }) => {
          siblingActioned = true;
          expect(messages).toEqual([
            { role: "user", content: "A" },
            { role: "assistant", content: "B" },
          ]);
        }}
      >
        Done
      </Generative>
    </GenerativeProvider>,
  );
  await findByText("Done");
  // await sleep(500);
  expect(siblingActioned).toEqual(true);
});

it("renders correctly", async () => {
  let testActioned = false;
  const TestMessages = () => {
    return (
      <Generative
        action={({ messages, signal }) => {
          testActioned = true;
          expect(messages.map((m) => m.content)).toEqual(["1", "2", "1", "2"]);
        }}
      >
        3
      </Generative>
    );
  };

  const { findByText } = render(
    <GenerativeProvider options={{ logLevel: "debug" }}>
      <Repeat limit={2}>
        <System content="1">1</System>
        <System content="2">2</System>
      </Repeat>
      <TestMessages />
    </GenerativeProvider>,
  );
  await findByText("3");
  console.log("Finished waiting");
  expect(testActioned).toEqual(true);
}, 20_000);
