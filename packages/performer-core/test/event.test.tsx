import { expect, test } from "vitest";
import {
  createErrorEvent,
  createMessageEvent,
  PerformerEventMap,
} from "../src/index.js";
import { nanoid } from "nanoid";
import Emittery from "emittery";

test("should use static type of subclass", () => {
  const evt = createErrorEvent("root", { error: "Oops" });
  expect(evt.type).toEqual("error");
});

test("should stringify", () => {
  const evt = createErrorEvent("root", { error: "Oops" });
  expect(JSON.stringify(evt)).toEqual(
    '{"type":"error","threadId":"root","detail":{"message":"Oops"}}',
  );
});

test("should support wildcard", async () => {
  const eventTarget = new Emittery<PerformerEventMap>();
  let count = 0;
  let errorCount = 0;
  const listener = () => {
    count += 1;
  };
  eventTarget.on("error", () => {
    errorCount += 1;
  });
  eventTarget.onAny(listener);
  await eventTarget.emit(
    "error",
    createErrorEvent("root", { error: { message: "1" } }),
  );
  // await sleep(0);
  expect(count).toEqual(1);
  expect(errorCount).toEqual(1);
  await eventTarget.emit(
    "error",
    createErrorEvent("root", { error: { message: "2" } }),
  );

  expect(count).toEqual(2);
  expect(errorCount).toEqual(2);
  eventTarget.offAny(listener);
  await eventTarget.emit(
    "error",
    createErrorEvent("root", { error: { message: "3" } }),
  );
  expect(count).toEqual(2);
  expect(errorCount).toEqual(3);
});

test("message event should generate uid if not provided", () => {
  const event1 = createMessageEvent("root", {
    message: { role: "user", content: [{ type: "text", text: "Hello world" }] },
  });
  expect(event1.detail.uid).toBeDefined();
  const uid = nanoid();
  const event2 = createMessageEvent("root", {
    uid,
    message: { role: "user", content: [{ type: "text", text: "Hello world" }] },
  });
  expect(event2.detail.uid).toEqual(uid);
});
