import { test } from "vitest";
import { Performer } from "@performer/core";
import { App } from "../src/with-sql-tool/index.js";
import * as process from "process";

test.skipIf(!process.env.VITE_TEST_HAS_CHINOOK_DB)(
  "should use SQL tool to answer users question",
  async () => {
    const performer = new Performer(<App />);
    performer.start();
    performer.input({
      role: "user",
      content: [{ type: "text", text: "How many employees are there?" }],
    });
    await performer.waitUntilSettled();
  },
);
