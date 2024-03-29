import { assert, expect, test } from "vitest";
import {
  Performer,
  resolveMessages,
  User,
  UserMessage,
} from "../../src/index.js";
import { testHydration } from "../util/test-hydration.js";
import { render } from "@testing-library/react";
import { Generative } from "../../src/components/Generative.js";
import { Action } from "../../src/components/Action.js";
import { useSubmit } from "../../src/hooks/use-submit.js";
import { useEffect } from "react";

test("should accept user input", async () => {
  let siblingActioned = false;
  function UserInput() {
    const submit = useSubmit();
    useEffect(() => {
      submit("A");
    }, []);
    return null;
  }
  const { findByText } = render(
    <Generative options={{ logLevel: "debug" }}>
      <User />
      <Action
        action={({ messages }) => {
          siblingActioned = true;
          expect(messages).toEqual([{ role: "user", content: "A" }]);
        }}
      >
        Done
      </Action>
      <UserInput />
    </Generative>,
  );
  await findByText("Done");
  expect(siblingActioned).toEqual(true);
});
