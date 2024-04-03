import { GenerativeContext, Performer } from "../../src/index.js";
import { useContext } from "react";
import { afterEach } from "vitest";

let performer: Performer | undefined;

export function UsePerformer() {
  const context = useContext(GenerativeContext);
  performer = context.performer;
  return null;
}

export function getPerformer() {
  return performer;
}

afterEach(() => {
  performer = undefined;
});
