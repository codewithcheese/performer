/* @vitest-environment jsdom */
import { assert, expect, test } from "vitest";
import { z } from "zod";
import {
  Assistant,
  createTool,
  Generative,
  getToolCall,
  System,
  User,
} from "../src/index.js";
import { useState } from "react";
import { ErrorBoundary } from "./util/ErrorBoundary.js";
import { render } from "@testing-library/react";
import { getPerformer, UsePerformer } from "./util/UsePerformer.js";

test("should use tool", async () => {
  function UseTool() {
    const [sum, setSum] = useState<number | null>(null);
    const HelloSchema = z
      .object({
        sum: z.number(),
      })
      .describe("1 + 1");
    const tool = createTool("sum", HelloSchema);

    if (sum) {
      return <div>Success</div>;
    } else {
      return (
        <Assistant
          onBeforeResolved={(message) => {
            const call = getToolCall(tool, message);
            assert(call);
            setSum(call.data.sum);
          }}
          model="gpt-4-1106-preview"
          toolChoice={tool}
          tools={[tool]}
        >
          <Loading />
        </Assistant>
      );
    }
  }
  function Loading() {
    return <div>...</div>;
  }
  const app = (
    <Generative>
      <UsePerformer />
      <ErrorBoundary>
        <System content="Say hello to world" />
        <UseTool />
      </ErrorBoundary>
    </Generative>
  );
  const { container, findByText } = render(app);
  const performer = getPerformer()!;
  await performer.waitUntilSettled();
  const result = await findByText("Success");
  console.log(container.innerHTML);
});

test("should use multiple tools", async () => {
  const WidgetCountSchema = z
    .object({
      count: z.number(),
    })
    .describe("Extract count of widgets");
  const WidgetNameSchema = z
    .object({
      name: z.string(),
    })
    .describe("Extact name of widget");
  function App() {
    const countTool = createTool("extractCount", WidgetCountSchema);
    const nameTool = createTool("extractName", WidgetNameSchema);
    return (
      <Generative>
        <UsePerformer />
        <System content=">Use tools to extract widget information." />
        <User
          content={`
          Widget of the day:
          name: Gizmo
          count: 42
        `}
        />
        <Assistant toolChoice={"auto"} tools={[countTool, nameTool]}>
          {(message) => {
            return message.tool_calls?.length;
          }}
        </Assistant>
      </Generative>
    );
  }
  const { findByText } = render(<App />);
  const performer = getPerformer()!;
  await performer.waitUntilSettled();
  await findByText("2");
});
