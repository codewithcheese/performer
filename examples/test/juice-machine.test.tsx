import { test } from "vitest";
import { Performer, MessageEvent } from "@performer/core";
import { App } from "../src/juice-machine/index.js";

test("juice machine should dispense the users selected juice after payment", async () => {
  const element = <App />;
  const performer = new Performer({ element });
  performer.logConfig.showDeltaEvents = false;
  performer.start();
  await performer.waitUntilSettled();
  performer.input(
    new MessageEvent({
      payload: {
        role: "user",
        content: [
          { type: "text", text: "I would like Apple and Mango juice please!" },
        ],
      },
    }),
  );
  await performer.waitUntilSettled();
  performer.input(
    new MessageEvent({
      payload: {
        role: "user",
        content: [{ type: "text", text: "**insert payment**" }],
      },
    }),
  );
  await performer.waitUntilSettled();
}, 60_000);
