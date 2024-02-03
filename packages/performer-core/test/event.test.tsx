import { expect, test } from "vitest";
import {
  PerformerMessageEvent,
  PerformerErrorEvent,
  PerformerEventMap,
} from "../src/index.js";
import { TypedEventTarget } from "../src/util/typed-event-target.js";
import { nanoid } from "nanoid";

test("should use static type of subclass", () => {
  const evt = new PerformerErrorEvent("Oops");
  expect(evt.type).toEqual("error");
});

test("should stringify", () => {
  const evt = new PerformerErrorEvent("Oops");
  expect(JSON.stringify(evt)).toEqual(
    '{"type":"error","detail":{"message":"Oops"}}',
  );
});

test("should support wildcard", () => {
  const eventTarget = new TypedEventTarget<PerformerEventMap>();
  let count = 0;
  let errorCount = 0;
  const listener = () => {
    count += 1;
  };
  eventTarget.addEventListener("error", () => {
    errorCount += 1;
  });
  eventTarget.addEventListener("*", listener);
  eventTarget.dispatchEvent(new PerformerErrorEvent({ message: "1" }));
  expect(count).toEqual(1);
  expect(errorCount).toEqual(1);
  eventTarget.dispatchEvent(new PerformerErrorEvent({ message: "2" }));
  expect(count).toEqual(2);
  expect(errorCount).toEqual(2);
  eventTarget.removeEventListener("*", listener);
  eventTarget.dispatchEvent(new PerformerErrorEvent({ message: "3" }));
  expect(count).toEqual(2);
  expect(errorCount).toEqual(3);
});

test("message event should generate uid if not provided", () => {
  const event1 = new PerformerMessageEvent({
    message: { role: "user", content: [{ type: "text", text: "Hello world" }] },
  });
  expect(event1.detail.uid).toBeDefined();
  const uid = nanoid();
  const event2 = new PerformerMessageEvent({
    uid,
    message: { role: "user", content: [{ type: "text", text: "Hello world" }] },
  });
  expect(event2.detail.uid).toEqual(uid);
});
