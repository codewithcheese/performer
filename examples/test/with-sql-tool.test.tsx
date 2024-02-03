import { test } from "vitest";
import { Performer, PerformerMessageEvent } from "@performer/core";
import { App } from "../src/with-sql-tool/index.js";
import * as process from "process";

test.skipIf(!process.env.VITE_TEST_HAS_CHINOOK_DB)(
  "should use SQL tool to answer users question",
  async () => {
    const element = <App />;
    const performer = new Performer({ element });
    performer.start();
    performer.input(
      new PerformerMessageEvent({
        message: {
          role: "user",
          content: [{ type: "text", text: "How many employees are there?" }],
        },
      }),
    );
    await performer.waitUntilSettled();
  },
);
