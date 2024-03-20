import { expect, test } from "vitest";
import { newChatNode, parse, state, stringify } from "../src/store";

test("should stringify chat node with pending performer", async () => {
  newChatNode({ position: { x: 0, y: 0 } });
  const str = stringify(state);
  const parsed = await parse(str);
  expect(parsed).toEqual(state);
});
