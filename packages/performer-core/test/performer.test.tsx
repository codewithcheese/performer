import { expect, test } from "vitest";
import { Performer, User, PerformerMessageEvent } from "../src/index.js";
import { nanoid } from "nanoid";

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

// test('should abort assistant response', async () => {
// 	const app = (
// 		<>
// 			<system>Hello world in Javascript. Code only.</system>
// 			<Assistant />
// 		</>
// 	);
// 	const session = new RunSession({ element: app });
// 	session.start();
// 	session.abort();
// 	await session.waitUntilSettled();
// });
