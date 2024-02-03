import { expect, test } from "vitest";
import {
  Assistant,
  Performer,
  PerformerErrorEvent,
  PerformerMessageEvent,
  User,
} from "../src/index.js";

test("should wait for input before performer is finished", async () => {
  const app = <User />;
  const performer = new Performer({ element: app });
  console.time("Render");
  performer.start();
  await performer.waitUntilSettled();
  expect(performer.inputNode).toBeDefined();
  expect(performer.hasFinished).toEqual(false);
  performer.input(
    new PerformerMessageEvent({
      message: {
        role: "user",
        content: [{ type: "text", text: "Hold me close" }],
      },
    }),
  );
  await performer.waitUntilSettled();
  expect(performer.hasFinished).toEqual(true);
});

test("should wait for multiple inputs", async () => {
  const app = (
    <>
      <User />
      <User />
      <User />
    </>
  );
  const performer = new Performer({ element: app });
  console.time("Render");
  performer.start();
  await performer.waitUntilSettled();
  expect(performer.hasFinished).toEqual(false);
  performer.input(
    new PerformerMessageEvent({
      message: {
        role: "user",
        content: [{ type: "text", text: "Hold me close" }],
      },
    }),
  );
  await performer.waitUntilSettled();
  expect(performer.hasFinished).toEqual(false);
  performer.input(
    new PerformerMessageEvent({
      message: {
        role: "user",
        content: [{ type: "text", text: "Hold me close" }],
      },
    }),
  );
  await performer.waitUntilSettled();
  expect(performer.hasFinished).toEqual(false);
  performer.input(
    new PerformerMessageEvent({
      message: {
        role: "user",
        content: [{ type: "text", text: "Hold me close" }],
      },
    }),
  );
  await performer.waitUntilSettled();
  expect(performer.hasFinished).toEqual(true);
});

// fixme: catch abort error
// test("should abort assistant response", async () => {
//   const app = (
//     <>
//       <system>Hello world in Javascript. Code only.</system>
//       <Assistant />
//     </>
//   );
//   const performer = new Performer({ element: app, throwOnError: false });
//   const events: PerformerErrorEvent[] = [];
//   performer.addEventListener("error", (event) => {
//     events.push(event);
//   });
//   performer.start();
//   performer.abort();
//   await performer.waitUntilSettled();
//   expect(performer.hasFinished).toEqual(true);
//   expect(events).toHaveLength(1);
// });
