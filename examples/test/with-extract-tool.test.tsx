import { assert, expect, test } from "vitest";
import { resolveMessages, Performer } from "@performer/core";
import { App } from "../src/with-extract-tool/index.js";

test("should use tool to extract data", async () => {
  const element = <App />;
  const performer = new Performer({ element });
  performer.start();
  await performer.waitUntilSettled();
  const messages = resolveMessages(performer.node);
  expect(messages).toHaveLength(4);
  assert(messages[3]);
  expect(messages[3].content).toEqual(
    JSON.stringify({
      people: [
        { name: "jane", age: 2 },
        { name: "bob", age: 3 },
      ],
    }),
  );
});
