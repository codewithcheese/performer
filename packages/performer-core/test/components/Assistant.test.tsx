/* @vitest-environment jsdom */
import { afterEach, assert, expect, test } from "vitest";
import {
  Assistant,
  createTool,
  Generative,
  GenerativeContext,
  Message,
  Performer,
  PerformerMessage,
  readTextContent,
  System,
} from "../../src/index.js";
import { render } from "@testing-library/react";
import { sleep } from "openai/core";
import "dotenv/config";
import { useCallback, useContext } from "react";
import { z } from "zod";

let performer: Performer | undefined;
function UsePerformer() {
  const context = useContext(GenerativeContext);
  performer = context.performer;
  return null;
}

const renderContent = (message: PerformerMessage) => readTextContent(message);

afterEach(() => {
  performer = undefined;
});

test("should call model with messages", async () => {
  let done = false;
  const app = (
    <Generative>
      <UsePerformer />
      <System content="JSON true value" />
      <Assistant requestOptions={{ response_format: { type: "json_object" } }}>
        <Message
          action={({ messages }) => {
            done = true;
            expect(messages).toHaveLength(2);
            expect(messages[0].role).toEqual("system");
            expect(messages[1].role).toEqual("assistant");
          }}
        >
          Done
        </Message>
      </Assistant>
    </Generative>
  );
  const { findByText } = render(app);
  await performer!.waitUntilSettled();
  await findByText("Done");
  expect(done).toEqual(true);
}, 10_000);

// test("should call onMessage event handler after assistant response", async () => {
//   function App() {
//     const received = useState(false);
//     return () => (
//       <>
//         <system>1+1. Scalar only, no preamble.</system>
//         <Assistant onMessage={() => (received.value = true)} />
//         {received && <user>Thank you</user>}
//       </>
//     );
//   }
//   const performer = new Performer(<App />);
//   performer.start();
//   await performer.waitUntilFinished();
//   const messages = performer.getAllMessages();
//   expect(messages).toHaveLength(3);
//   expect(messages[2]).toEqual({ role: "user", content: "Thank you" });
//   const hydratedPerformer = await testHydration(performer);
//   const hydratedMessages = hydratedPerformer.getAllMessages();
//   expect(hydratedMessages).toHaveLength(3);
// });
//
test("should use tool", async () => {
  const tool = createTool("answer", z.object({ answer: z.boolean() }));
  const app = (
    <Generative>
      <UsePerformer />
      <System content="1+1. Scalar only, no preamble." />
      <Assistant tools={[tool]} toolChoice={tool} />
    </Generative>
  );
  const {} = render(app);
  await performer!.waitUntilSettled();
  const messages = performer!.getAllMessages();
  expect(messages).toHaveLength(2);
  assert(messages[1].role === "assistant");
  expect(messages[1].tool_calls).toHaveLength(1);
});
//
// test("should emit error event when apiKey is incorrect", async () => {
//   function App() {
//     return () => (
//       <>
//         <system>The answer is 42. Be concise.</system>
//         <user>What is the answer?</user>
//         <Assistant apiKey="deadbeef" />
//       </>
//     );
//   }
//   const performer = new Performer(<App />, { throwOnError: false });
//   let hasErrorEvent = false;
//   performer.addEventListener("error", () => {
//     hasErrorEvent = true;
//   });
//
//   process.on("unhandledRejection", (reason, promise) => {
//     console.error("Unhandled Rejection at:", promise, "reason:", reason);
//     // Handle the error appropriately
//   });
//
//   process.setUncaughtExceptionCaptureCallback((err) => {
//     console.error(err);
//   });
//
//   performer.start();
//   await performer.waitUntilFinished();
//   expect(hasErrorEvent, "Expected error").toEqual(true);
// }, 10_000);
//
// test.skipIf(!process.env.OPENROUTER_API_KEY)(
//   "should use open router",
//
//   async () => {
//     function Mixtral(props: any) {
//       return Assistant({
//         model: "mistralai/mixtral-8x7b-instruct",
//         baseURL: "https://openrouter.ai/api/v1",
//         apiKey: process.env.OPENROUTER_API_KEY,
//         ...props,
//       });
//     }
//
//     function App() {
//       return () => (
//         <>
//           <system>Your name is Bob.</system>
//           <user>Whats your name?</user>
//           <Mixtral />
//         </>
//       );
//     }
//     const performer = new Performer(<App />);
//     performer.start();
//     await performer.waitUntilFinished();
//     const message = resolveMessages(performer.root!);
//     console.log(message);
//   },
//   20_000,
// );
//
// test.skipIf(!process.env.PERPLEXITY_API_KEY)(
//   "should use perplexity",
//
//   async () => {
//     function Perplexity(props: any) {
//       return Assistant({
//         model: "sonar-medium-online",
//         baseURL: "https://api.perplexity.ai",
//         apiKey: process.env.PERPLEXITY_API_KEY,
//         ...props,
//       });
//     }
//
//     function App() {
//       return () => (
//         <>
//           <user>Has GPT-5 been released yet</user>
//           <Perplexity />
//         </>
//       );
//     }
//     const performer = new Performer(<App />);
//     performer.start();
//     await performer.waitUntilFinished();
//     const messages = performer.getAllMessages();
//     expect(messages).toHaveLength(2);
//     expect(messages[0].role).toEqual("user");
//     expect(messages[1].role).toEqual("assistant");
//   },
//   20_000,
// );
//
// test.skipIf(process.env.USE_OLLAMA !== "true")(
//   "should use ollama model",
//
//   async () => {
//     function Ollama({ model }: { model: string }) {
//       return Assistant({
//         model,
//         baseURL: "http://localhost:11434/v1",
//       });
//     }
//
//     function App() {
//       return () => (
//         <>
//           <system>Your name is Bob.</system>
//           <user>Whats your name? Be concise.</user>
//           <Ollama model="phi" />
//         </>
//       );
//     }
//     const performer = new Performer(<App />);
//     performer.start();
//     await performer.waitUntilFinished();
//     const message = resolveMessages(performer.root!);
//     console.log(message);
//   },
//   20_000,
// );
