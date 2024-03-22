import { test } from "vitest";
import { Performer } from "@performer/core";
import { App } from "../src/suggestions/index.js";

test("should suggest tasks and questions", async () => {
  const performer = new Performer(<App />);
  performer.start();
  await performer.waitUntilListening();
  performer.input({
    role: "user",
    content: [
      {
        type: "text",
        text: "What is an effectively daily exercise I can use to improve my active learning skills?",
      },
    ],
  });
  await performer.waitUntilListening();
}, 60_000);
