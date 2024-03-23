import { expect, test } from "vitest";
import { Performer } from "../../src/index.js";
import { createLookup } from "./lookup-node.js";

test("should lookup node", async () => {
  function Container({ children }: any) {
    return () => children;
  }

  function App() {
    return () => (
      <>
        <user>1</user>
        <Container>
          <assistant>2</assistant>
          <assistant>2</assistant>
        </Container>
      </>
    );
  }

  const performer = new Performer(<App />);
  performer.start();
  await performer.waitUntilFinished();

  const lookup = createLookup(performer.root!);
  // explicit index
  const assistant1 = lookup("Fragment[0]->Container[0]->assistant[0]");
  expect(assistant1).toEqual(performer.root?.child?.child?.nextSibling?.child);
  // assume 0 index if not provided
  const assistant2 = lookup("Fragment->Container->assistant");
  expect(assistant2).toEqual(performer.root?.child?.child?.nextSibling?.child);
  // non-zero index
  const assistant3 = lookup("Fragment[0]->Container[0]->assistant[1]");
  expect(assistant3).toEqual(
    performer.root?.child?.child?.nextSibling?.child?.nextSibling,
  );
});
