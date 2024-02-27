import { test } from "vitest";
import { Performer } from "@performer/core";
import { App } from "../src/repo-question/index.js";

test("should answer question about openai github repos", async () => {
  const performer = new Performer(<App user="openai" />);
  performer.logConfig.showDeltaEvents = false;
  performer.start();
  await performer.waitUntilSettled();
}, 60_000);
