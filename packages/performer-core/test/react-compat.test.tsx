/** @jsxImportSource react */
// @ts-nocheck
import { expect, test } from "vitest";
import { Performer, resolveMessages } from "../src/index.js";
import { testHydration } from "./util/test-hydration.js";

test("should render and resolve intrinsic element", async () => {
  const app = (
    <>
      <system>Greet the user</system>
      <assistant>Hello how can I help you?</assistant>
      <user>Tell me a joke, please.</user>
    </>
  );
  const performer = new Performer(app);
  performer.start();
  await performer.waitUntilSettled();
  const messages = resolveMessages(performer.root);
  expect(messages).toHaveLength(3);
  expect(messages[0].role).toEqual("system");
  expect(messages[1].role).toEqual("assistant");
  expect(messages[2].role).toEqual("user");
  await testHydration(performer);
});
