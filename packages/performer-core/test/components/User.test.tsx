/* @vitest-environment jsdom */
import { expect, test } from "vitest";
import { User } from "../../src/index.js";
import { render } from "@testing-library/react";
import { Generative } from "../../src/components/Generative.js";
import { Message } from "../../src/components/Message.js";
import { useSubmit } from "../../src/hooks/use-submit.js";
import { useEffect } from "react";

test("should accept user input", async () => {
  let siblingActioned = false;
  function UserInput({ content }: { content: string }) {
    const submit = useSubmit();
    submit("A");
    return null;
  }
  const { findByText } = render(
    <Generative options={{ logLevel: "debug" }}>
      <User />
      <Message
        action={({ messages }) => {
          siblingActioned = true;
          expect(messages).toEqual([{ role: "user", content: "A" }]);
        }}
      >
        Done
      </Message>
      <UserInput content="A" />
    </Generative>,
  );
  await findByText("Done");
  expect(siblingActioned).toEqual(true);
});
