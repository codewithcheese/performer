import { assert, expect, test } from "vitest";
import { resolveMessages, Performer } from "@performer/core";
import { App } from "../src/with-extract-tool/index.js";

test("should use tool to extract data", async () => {
  const element = <App />;
  const performer = new Performer({ element });
  performer.start();
  await performer.waitUntilSettled();
  const messages = resolveMessages(performer.node);
});
