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

test("should wildcard", () => {
  const eventTarget = new TypedEventTarget<PerformerEventMap>();
  eventTarget.addEventListener("*" as any, (evt: any) => {
    console.log(evt);
  });
  eventTarget.dispatchEvent(new ErrorEvent({ message: "Yikes" }));
});
