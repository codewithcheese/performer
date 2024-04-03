/* @vitest-environment jsdom */
import { expect, test } from "vitest";
import {
  Generative,
  readTextContent,
  User,
  useSubmit,
} from "../../src/index.js";
import { render } from "@testing-library/react";

test("should receive user message via useSubmit", async () => {
  function UserInput() {
    const submit = useSubmit();
    submit("A");
    return null;
  }
  const { findByText } = render(
    <Generative options={{ logLevel: "debug" }}>
      <User>{readTextContent}</User>
      <UserInput />
    </Generative>,
  );
  await findByText("A");
});

test("should set user message via content", async () => {
  const { findByText } = render(
    <Generative options={{ logLevel: "debug" }}>
      <User content="A">{readTextContent}</User>
    </Generative>,
  );
  await findByText("A");
});
