import { expect, test } from "vitest";
import { ErrorEvent, PerformerEventMap } from "../src/index.js";
import { TypedEventTarget } from "../src/util/typed-event-target.js";

test("should use static type of subclass", () => {
  const evt = new ErrorEvent("Oops");
  expect(evt.type).toEqual("error");
});

test("should stringify", () => {
  const evt = new ErrorEvent("Oops");
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
  eventTarget.dispatchEvent(new ErrorEvent({ message: "1" }));
  expect(count).toEqual(1);
  expect(errorCount).toEqual(1);
  eventTarget.dispatchEvent(new ErrorEvent({ message: "2" }));
  expect(count).toEqual(2);
  expect(errorCount).toEqual(2);
  eventTarget.removeEventListener("*", listener);
  eventTarget.dispatchEvent(new ErrorEvent({ message: "3" }));
  expect(count).toEqual(2);
  expect(errorCount).toEqual(3);
});
