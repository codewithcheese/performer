/* @vitest-environment jsdom */
import { expect, test } from "vitest";
import { Assistant, Generative, Performer, User } from "../src/index.js";
import { sleep } from "openai/core";
import { getPerformer, UsePerformer } from "./util/UsePerformer.js";
import { render } from "@testing-library/react";

test("should wait for input before performer is finished", async () => {
  const app = (
    <Generative options={{ logLevel: "debug" }}>
      <UsePerformer />
      <User />
    </Generative>
  );
  const {} = render(app);
  const performer = getPerformer()!;
  await performer.waitUntilListening();
  performer.submit({
    role: "user",
    content: [{ type: "text", text: "A" }],
  });
  await performer.waitUntilFinished();
});

test("should wait for multiple inputs", async () => {
  const app = (
    <Generative options={{ logLevel: "debug" }}>
      <UsePerformer />
      <User />
      <User />
      <User />
    </Generative>
  );
  const {} = render(app);
  const performer = getPerformer()!;
  await performer.waitUntilListening();
  performer.submit({
    role: "user",
    content: [{ type: "text", text: "A" }],
  });
  await performer.waitUntilListening();
  performer.submit({
    role: "user",
    content: [{ type: "text", text: "B" }],
  });
  await performer.waitUntilListening();
  performer.submit({
    role: "user",
    content: [{ type: "text", text: "C" }],
  });
  await performer.waitUntilFinished();
});
