/* @vitest-environment jsdom */
import { expect, test } from "vitest";
import {
  Action,
  Generative,
  GenerativeContext,
  GenerativeContextType,
  MessageDelta,
  Performer,
  PerformerMessage,
  readTextContent,
  System,
} from "../src/index.js";
import { sleep } from "openai/core";
import { findAllByText, findByText, render } from "@testing-library/react";
import { ReactNode, useContext, useEffect, useState } from "react";

test("should render on each stream update but not finalize until stream complete", async () => {
  function streamAction() {
    const chars = ["A", "B", "C", "D", "E"];
    return new ReadableStream<MessageDelta>({
      async start(controller) {
        for (let i = 0; i < chars.length; i++) {
          controller.enqueue({ content: chars[i] });
          await sleep(100);
        }
        controller.close();
      },
    });
  }

  function Streamer() {
    return (
      <Action action={streamAction}>
        {(message) => {
          // console.log("Render streamer", message);
          return readTextContent(message) + "!";
        }}
      </Action>
    );
  }

  const { findByText } = render(
    <Generative options={{ logLevel: "debug" }}>
      <Streamer />
    </Generative>,
  );
  await findByText("A!");
  await sleep(1000);
  await findByText("ABCDE!");
});

test("should update when message prop changes", async () => {
  const app = (
    <Generative options={{ logLevel: "debug" }}>
      <System content={"A"}>{(message) => readTextContent(message)}</System>
    </Generative>
  );
  const { rerender, findByText } = render(app);
  await findByText("A");
  rerender(
    <Generative options={{ logLevel: "debug" }}>
      <System content={"B"}>{(message) => readTextContent(message)}</System>
    </Generative>,
  );
  await findByText("B");
});

// function Container({ children }: any) {
//   return () => children;
// }

// test("should render and resolve intrinsic element", async () => {
//   const app = (
//     <>
//       <system>Greet the user</system>
//       <assistant>Hello how can I help you?</assistant>
//       <user>Tell me a joke, please.</user>
//     </>
//   );
//   const performer = new Performer(app);
//   performer.start();
//   await performer.waitUntilFinished();
//   const messages = resolveMessages(performer.root);
//   expect(messages).toHaveLength(3);
//   expect(messages[0].role).toEqual("system");
//   expect(messages[1].role).toEqual("assistant");
//   expect(messages[2].role).toEqual("user");
//   await testHydration(performer);
// });

// test("should render view", async () => {
//   function AChild() {
//     return () => null;
//   }
//   function BChild() {
//     return () => null;
//   }
//   function AComponent() {
//     console.log("hello");
//     useResource(sleep, 10);
//     console.log("world");
//     return () => (
//       <Container>
//         <AChild>hello a</AChild>
//         <AChild>hello a+</AChild>
//         <BChild>hello b</BChild>
//       </Container>
//     );
//   }
//   const app = <AComponent />;
//   const performer = new Performer(app);
//   performer.start();
//   await performer.waitUntilFinished();
//   await testHydration(performer);
// });

// test("should update prop when signal changes", async () => {
//   function Receiver({ message }: any) {
//     expect(message, "Message should not be null").not.toBeNull();
//     return () => {};
//   }
//   function App() {
//     const message = useState<PerformerMessage | null>(null);
//     return () => (
//       <>
//         <user
//           onMessage={(userMessage) => {
//             console.log("onMessage", userMessage);
//             message.value = userMessage;
//           }}
//         >
//           Hello world
//         </user>
//         <Receiver message={message.value} />
//       </>
//     );
//   }
//   const performer = new Performer(<App />);
//   performer.start();
//   await performer.waitUntilFinished();
//   await testHydration(performer);
// });

// test("should update and run message actions when state changes", async () => {
//   function DelayedIf({ children }: any) {
//     const predicate = useState(false);
//     return () => predicate.value && children;
//   }
//   const app = (
//     <>
//       <user>X = 0. Answer with scalar.</user>
//       <DelayedIf>
//         <user>Increment X by 1</user>
//         <user>X = 1</user>
//       </DelayedIf>
//     </>
//   );
//   const performer = new Performer(app);
//   performer.start();
//   await performer.waitUntilFinished();
//   let messages = resolveMessages(performer.root);
//   expect(messages).toHaveLength(1);
//
//   performer.root!.child!.nextSibling!.hooks["state-0"].value = true;
//   performer.start();
//
//   await performer.waitUntilFinished();
//   messages = resolveMessages(performer.root);
//   expect(messages).toHaveLength(3);
//   await testHydration(performer);
// });
//
test("should update message order when elements are reordered", async () => {
  function Rotate({ children, offset = 0 }: any) {
    return children.slice(offset).concat(children.slice(0, offset));
  }
  let performer: Performer;
  function GetContext() {
    const context = useContext(GenerativeContext);
    performer = context.performer;
    return null;
  }
  const renderContent = (message: PerformerMessage) => readTextContent(message);

  const renderApp = (offset: number) => (
    <Generative options={{ logLevel: "debug" }}>
      <GetContext />
      <Rotate offset={offset}>
        <System content="A">{renderContent}</System>
        <System content="B">{renderContent}</System>
        <System content="C">{renderContent}</System>
      </Rotate>
    </Generative>
  );

  const { rerender, findByText } = render(renderApp(0));

  let elementA = await findByText("A");
  let elementB = await findByText("B");
  let elementC = await findByText("C");

  // Assert the order of elements
  expect(elementA.compareDocumentPosition(elementB)).toBe(
    Node.DOCUMENT_POSITION_FOLLOWING,
  );
  expect(elementB.compareDocumentPosition(elementC)).toBe(
    Node.DOCUMENT_POSITION_FOLLOWING,
  );

  let messages = performer!.getAllMessages();
  expect(messages.map((m) => m.content)).toEqual(["A", "B", "C"]);

  // rotate right
  rerender(renderApp(-1));

  elementA = await findByText("A");
  elementB = await findByText("B");
  elementC = await findByText("C");

  expect(elementA.compareDocumentPosition(elementB)).toBe(
    Node.DOCUMENT_POSITION_FOLLOWING,
  );
  expect(elementC.compareDocumentPosition(elementA)).toBe(
    Node.DOCUMENT_POSITION_FOLLOWING,
  );

  messages = performer!.getAllMessages();
  expect(messages.map((m) => m.content)).toEqual(["C", "A", "B"]);

  // rotate left
  rerender(renderApp(1));

  elementA = await findByText("A");
  elementB = await findByText("B");
  elementC = await findByText("C");

  expect(elementB.compareDocumentPosition(elementC)).toBe(
    Node.DOCUMENT_POSITION_FOLLOWING,
  );
  expect(elementC.compareDocumentPosition(elementA)).toBe(
    Node.DOCUMENT_POSITION_FOLLOWING,
  );

  messages = performer!.getAllMessages();
  expect(messages.map((m) => m.content)).toEqual(["B", "C", "A"]);
});

test("should render new elements when dynamically added or removed", async () => {
  let performer: Performer;
  function GetContext() {
    const context = useContext(GenerativeContext);
    performer = context.performer;
    return null;
  }
  const renderContent = (message: PerformerMessage) => readTextContent(message);
  function Repeater({ times, children }: any) {
    return Array(times).fill(children).flat();
  }
  const renderApp = (times: number) => (
    <Generative options={{ logLevel: "debug" }}>
      <GetContext />
      <Repeater times={times}>
        <System content="A">{renderContent}</System>
      </Repeater>
    </Generative>
  );
  const { rerender, findAllByText } = render(renderApp(1));
  let elements = await findAllByText("A");
  let messages = performer!.getAllMessages();
  expect(
    elements.map((e) => e.textContent),
    "Element content does match expected",
  ).toEqual(["A"]);
  expect(
    elements.map((e) => e.textContent),
    "Element content does not match messages",
  ).toEqual(messages.map((m) => m.content));

  // add two
  console.log("add 2");
  rerender(renderApp(3));
  await performer!.waitUntilSettled();
  elements = await findAllByText("A");
  messages = performer!.getAllMessages();
  expect(
    elements.map((e) => e.textContent),
    "Element content does match expected",
  ).toEqual(["A", "A", "A"]);
  expect(
    elements.map((e) => e.textContent),
    "Element content does not match messages",
  ).toEqual(messages.map((m) => m.content));

  // remove one
  console.log("remove 1");
  rerender(renderApp(2));
  await performer!.waitUntilSettled();
  elements = await findAllByText("A");
  messages = performer!.getAllMessages();
  expect(
    elements.map((e) => e.textContent),
    "Element content does match expected",
  ).toEqual(["A", "A"]);
  expect(
    elements.map((e) => e.textContent),
    "Element content does not match messages",
  ).toEqual(messages.map((m) => m.content));
  console.log("done");

  // // rehydrate for second run
  // performer = await testHydration(performer);
  // // change state for second run
  // let times = performer.root!.hooks["state-0"];
  // times.value += 4;
  // performer.start();
  // // second run
  // await performer.waitUntilFinished();
  // messages = resolveMessages(performer.root, undefined);
  // expect(messages).toHaveLength(5);
  //
  // // rehydrate for third run
  // performer = await testHydration(performer);
  // // change state for third run
  // times = performer.root!.hooks["state-0"];
  // times.value -= 2;
  // performer.start();
  // // third run
  // await performer.waitUntilFinished();
  // messages = resolveMessages(performer.root, undefined);
  // expect(messages).toHaveLength(3);
  //
  // // rehydrate for fourth run
  // performer = await testHydration(performer);
  // // change state for fourth run
  // times = performer.root!.hooks["state-0"];
  // times.value -= 1;
  // performer.start();
  // // fourth run
  // await performer.waitUntilFinished();
  // messages = resolveMessages(performer.root, undefined);
  // expect(messages).toHaveLength(2);
  // // final hydration test
  // performer = await testHydration(performer);
}, 30_000);
//
// test("should unlink messages when removed by conditional", async () => {
//   function Temp({ children }: any) {
//     const predicate = useState<boolean>(true);
//     return () => (predicate.value ? children : []);
//   }
//   const app = (
//     <Temp>
//       <Container>
//         <user>Hello, world!</user>
//         <Container>
//           <user>Goodbye, world!</user>
//         </Container>
//       </Container>
//       <user>Help the user</user>
//       <user>What is the population of Australia?</user>
//     </Temp>
//   );
//   const performer = new Performer(app);
//   performer.start();
//   await performer.waitUntilFinished();
//   let messages = resolveMessages(performer.root, undefined);
//   expect(
//     messages.length,
//     "Expect 4 messages before they are unlinked by `If`",
//   ).toEqual(4);
//
//   const predicate = performer.root!.hooks["state-0"];
//   predicate.value = false;
//   performer.start();
//
//   await performer.waitUntilFinished();
//   messages = resolveMessages(performer.root, undefined);
//   expect(
//     messages.length,
//     "Expect 0 messages after they are unlinked by `If`",
//   ).toEqual(0);
//   await testHydration(performer);
// });
//
// test("should wait for async message actions", async () => {
//   function AsyncMessage() {
//     const isReady = useState<boolean>(false);
//     useResource(sleep, 10);
//     isReady.value = true;
//     return () => isReady && <system>Your name is Bob</system>;
//   }
//
//   const app = (
//     <Container>
//       <AsyncMessage />
//       <assistant>Hi, how can I help?</assistant>
//       <user>Hold me close</user>
//     </Container>
//   );
//   const performer = new Performer(app);
//   console.time("Render");
//   performer.start();
//   await performer.waitUntilFinished();
//   console.timeEnd("Render");
//   const messages = resolveMessages(performer.root);
//   expect(messages).toHaveLength(3);
//   expect(messages[0]).toEqual({
//     role: "system",
//     content: "Your name is Bob",
//   });
//   expect(messages[1]).toEqual({
//     role: "assistant",
//     content: "Hi, how can I help?",
//   });
//   expect(messages[2]).toEqual({
//     role: "user",
//     content: "Hold me close",
//   });
//   await testHydration(performer);
// });
//
// test("should render tree", async () => {
//   function First(props: any) {
//     return () => props.children;
//   }
//   function Second(props: any) {
//     return () => props.children;
//   }
//   function Greet(props: any) {
//     return () => props.children;
//   }
//   function Child() {
//     return () => null;
//   }
//   function Third() {
//     return () => <Child />;
//   }
//
//   const app = (
//     <>
//       <First>Greet the user</First>
//       <Second>
//         <Greet>Hello world</Greet>
//         <Third />
//       </Second>
//     </>
//   );
//   const performer = new Performer(app);
//   performer.start();
//   await performer.waitUntilFinished();
//   const root = performer.root!;
//   expect(root.parent).toBeUndefined();
//   expect(root.nextSibling).toBeUndefined();
//   expect(root.prevSibling).toBeUndefined();
//   const expected = {
//     type: "Fragment",
//     children: [
//       { type: "First", props: { children: "Greet the user" } },
//       {
//         type: "Second",
//         children: [
//           { type: "Greet", props: { children: "Hello world" } },
//           { type: "Third" },
//         ],
//       },
//     ],
//   };
//   expectTree(performer.root!, expected);
//   expect(root.child?.nextSibling?.nextSibling).toBeUndefined();
//   await testHydration(performer);
// });
//
// test("should catch sync component that throws", async () => {
//   function App() {
//     throw Error("Throwing!");
//     return () => {};
//   }
//   const performer = new Performer(<App />, { throwOnError: false });
//   performer.start();
//   const events: PerformerErrorEvent[] = [];
//   performer.addEventListener("error", (event) => {
//     events.push(event);
//   });
//   await performer.waitUntilFinished();
//   expect(events).toHaveLength(1);
// });
//
// test("should catch resumed component that throws", async () => {
//   function App() {
//     useResource(sleep, 10);
//     throw Error("Throwing!");
//     return () => {};
//   }
//   const performer = new Performer(<App />, { throwOnError: false });
//   performer.start();
//   const errors: PerformerErrorEvent[] = [];
//   performer.addEventListener("error", (event) => {
//     errors.push(event);
//   });
//   await performer.waitUntilFinished();
//   expect(errors).toHaveLength(1);
// });
//
// test("should throw if component is async function", async () => {
//   async function App() {
//     return () => <user>Hello, world!</user>;
//   }
//   // @ts-ignore
//   const performer = new Performer(<App />, { throwOnError: false });
//   performer.start();
//   await performer.waitUntilFinished();
//   expect(performer.errors).toHaveLength(1);
// });
//
// test("should cast non-string message children", async () => {
//   function App() {
//     return () => (
//       <system>
//         {/* @ts-expect-error null | undefined invalid message child type */}
//         Message with {1} and {0} and {true} and {false} and {null} and{" "}
//         {/* @ts-expect-error null | undefined invalid message child type */}
//         {undefined} {{}}
//       </system>
//     );
//   }
//   const performer = new Performer(<App />);
//   performer.start();
//   await performer.waitUntilFinished();
//   const messages = resolveMessages(performer.root);
//   expect(messages[0].content).toEqual(
//     "Message with 1 and 0 and true and false and null and undefined [object Object]",
//   );
// });
//
// // fixme: correctly handle exception
// // test("should throw if component children contains both strings and elements", async () => {
// //   expect(async () => {
// //     function App() {
// //       return () => (
// //         <>
// //           Hello World
// //           <></>
// //         </>
// //       );
// //     }
// //
// //     const performer = new Performer(<App />, { throwOnError: true });
// //     performer.start();
// //     await performer.waitUntilSettled();
// //   }).toThrow();
// // });
