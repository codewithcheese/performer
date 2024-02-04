import { expect, test } from "vitest";
import { Performer, resolveMessages, useState } from "../../src/index.js";

test("should create state signals using initial values", async () => {
  function App() {
    const age = useState(28);
    const name = useState(() => "Taylor");

    return () => (
      <system>
        The users name is {name.value}, they are {String(age.value)} years old.
      </system>
    );
  }
  const performer = new Performer(<App />);
  performer.start();
  await performer.waitUntilSettled();
  const messages = resolveMessages(performer.root);
  expect(messages).toHaveLength(1);
  expect(messages[0]).toEqual({
    role: "system",
    content: [
      {
        type: "text",
        text: "The users name is Taylor, they are 28 years old.",
      },
    ],
  });
});
