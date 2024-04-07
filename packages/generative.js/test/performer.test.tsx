/* @vitest-environment jsdom */
import { test } from "vitest";
import { GenerativeProvider, User } from "../src/index.js";
import { getGenerative, UseGenerative } from "./util/UseGenerative.js";
import { render } from "@testing-library/react";

test("should wait for input before generative is finished", async () => {
  const app = (
    <GenerativeProvider options={{ logLevel: "debug" }}>
      <UseGenerative />
      <User />
    </GenerativeProvider>
  );
  const {} = render(app);
  const generative = getGenerative()!;
  await generative.waitUntilListening();
  generative.submit({
    role: "user",
    content: [{ type: "text", text: "A" }],
  });
  await generative.waitUntilFinished();
});

test("should wait for multiple inputs", async () => {
  const app = (
    <GenerativeProvider options={{ logLevel: "debug" }}>
      <UseGenerative />
      <User />
      <User />
      <User />
    </GenerativeProvider>
  );
  const {} = render(app);
  const generative = getGenerative()!;
  await generative.waitUntilListening();
  generative.submit({
    role: "user",
    content: [{ type: "text", text: "A" }],
  });
  await generative.waitUntilListening();
  generative.submit({
    role: "user",
    content: [{ type: "text", text: "B" }],
  });
  await generative.waitUntilListening();
  generative.submit({
    role: "user",
    content: [{ type: "text", text: "C" }],
  });
  await generative.waitUntilFinished();
});
