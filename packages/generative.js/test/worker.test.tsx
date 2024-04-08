/* @vitest-environment jsdom */
import { expect, test } from "vitest";
import {
  createWorker,
  GenerativeProvider,
  Message,
  readTextContent,
  System,
} from "../src/index.js";
import { render } from "@testing-library/react";
import { getGenerative, UseGenerative } from "./util/UseGenerative.js";
import { sleep } from "../src/util/sleep.js";
import { useEffect, useMemo } from "react";
import { withResolvers } from "../src/util/with-resolvers.js";
import { useRenderCount } from "./util/render-count-hook.js";

test("should use 3 works concurrently and display `Done` when all finished", async () => {
  const workerApp = (system: string, completion: string) => (
    <>
      <System content={system}>{readTextContent}</System>
      <Message
        type={async () => {
          await sleep(500);
          return { role: "assistant", content: completion };
        }}
      >
        {readTextContent}
      </Message>
    </>
  );

  function Concurrently() {
    const workers = [
      createWorker(workerApp("A", "B"), "1"),
      createWorker(workerApp("C", "D"), "2"),
      createWorker(workerApp("E", "F"), "3"),
    ];
    const renderCount = useRenderCount();

    // resolve when all workers complete
    const { resolve, promise } = useMemo(() => withResolvers<void>(), []);
    useEffect(() => {
      if (workers.every(([, finished]) => finished)) {
        resolve();
      }
    });

    console.log(
      "Concurrently",
      "renderCount",
      renderCount,
      "finished",
      workers.map(([, finished]) => finished),
    );

    return (
      <Message type="NOOP">
        {workers.map(([worker]) => worker)}
        {/* use promise action to wait for all workers */}
        <Message type={() => promise}>Done.</Message>
      </Message>
    );
  }

  const app = (
    <GenerativeProvider>
      <UseGenerative />
      <Concurrently />
    </GenerativeProvider>
  );
  const { container, findByText } = render(app);
  const generative = getGenerative()!;
  await generative.waitUntilSettled();
  await findByText("Done.");
  expect(document.body.textContent).toEqual("Done.ABCDEF");
});
