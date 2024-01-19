import { assert, expect, test } from "vitest";
import {
  Assistant,
  isAssistantMessage,
  Performer,
  readTextContent,
  resolveMessages,
  useToolData,
} from "../../src/index.js";
import { z } from "zod";

test("should use tool to set signal", async () => {
  function App() {
    const [approval, tool] = useToolData(
      "was_approved",
      "When approval is given",
      z.object({ approved: z.boolean() }),
      { approved: false },
    );
    return () => {
      approval.value;
      if (!approval.value.approved) {
        return (
          <>
            <user>I approve!</user>
            <Assistant toolChoice={tool} tools={[tool]} />
          </>
        );
      } else {
        return <assistant>Approved!</assistant>;
      }
    };
  }
  const performer = new Performer({ element: <App /> });
  performer.start();
  await performer.waitUntilSettled();
  const messages = resolveMessages(performer.node);
  expect(messages).toHaveLength(1);
  assert(isAssistantMessage(messages[0]));
  expect(readTextContent(messages[0])).toEqual("Approved!");
}, 20_000);
