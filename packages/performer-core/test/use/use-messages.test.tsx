import { expect, test } from "vitest";
import { Performer, useMessages } from "../../src/index.js";

test("should be able to get messages", async () => {
  function MessageReceiver() {
    const messages = useMessages();
    expect(messages.some((m) => m.role === "system")).toBe(true);
    return () => {};
  }

  const app = (
    <>
      <system>Greet the user</system>
      <MessageReceiver />
    </>
  );

  const performer = new Performer({ element: app });
  performer.start();
  await performer.waitUntilFinished;
});
