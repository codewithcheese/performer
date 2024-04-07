/* @vitest-environment jsdom */
import { expect, test } from "vitest";
import {
  GenerativeProvider,
  readTextContent,
  User,
  useSubmit,
} from "../../src/index.js";
import { render } from "@testing-library/react";

test("should receive user message via useSubmit", async () => {
  function UserInput() {
    const submit = useSubmit();
    submit("user", "A");
    return null;
  }
  const { findByText } = render(
    <GenerativeProvider options={{ logLevel: "debug" }}>
      <User>{readTextContent}</User>
      <UserInput />
    </GenerativeProvider>,
  );
  await findByText("A");
});

test("should set user message via content", async () => {
  const { findByText } = render(
    <GenerativeProvider options={{ logLevel: "debug" }}>
      <User content="A">{readTextContent}</User>
    </GenerativeProvider>,
  );
  await findByText("A");
});
