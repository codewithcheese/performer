/* @vitest-environment jsdom */
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  test,
  vi,
} from "vitest";
import {
  Message,
  Generative,
  GenerativeContext,
  MessageDelta,
  Performer,
  PerformerMessage,
  readTextContent,
  System,
  UserMessage,
} from "../src/index.js";
import { sleep } from "openai/core";
import { findByText, render } from "@testing-library/react";
import { Component, ErrorInfo, ReactNode, useContext } from "react";

describe("Render", () => {
  let performer: Performer | undefined;
  function UsePerformer() {
    const context = useContext(GenerativeContext);
    performer = context.performer;
    return null;
  }

  const renderContent = (message: PerformerMessage) => readTextContent(message);

  // silence act warning
  const originalError = console.error;
  beforeAll(() => {
    console.error = (...args) => {
      if (/Warning.*not wrapped in act/.test(args[0])) {
        return;
      }
      originalError.call(console, ...args);
    };
  });

  afterAll(() => {
    console.error = originalError;
  });

  afterEach(() => {
    performer = undefined;
  });

  test("should render on each stream update but not finalize until stream complete", async () => {
    function streamAction() {
      const chars = ["A", "B", "C", "D", "E"];
      return new ReadableStream<MessageDelta>({
        async start(controller) {
          for (let i = 0; i < chars.length; i++) {
            controller.enqueue({ content: chars[i] });
            await sleep(20);
          }
          controller.close();
        },
      });
    }

    function Streamer() {
      return (
        <Message action={streamAction}>
          {(message) => {
            // console.log("Render streamer", message);
            return readTextContent(message) + "!";
          }}
        </Message>
      );
    }

    const { findByText } = render(
      <Generative options={{ logLevel: "debug" }}>
        <Streamer />
      </Generative>,
    );
    await findByText("A!");
    await sleep(500);
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
  test("should update message order when elements WITH KEYS are reordered", async () => {
    function Rotate({ children, offset = 0 }: any) {
      return children.slice(offset).concat(children.slice(0, offset));
    }

    const renderContent = (message: PerformerMessage) =>
      readTextContent(message);

    const renderApp = (offset: number) => (
      <Generative options={{ logLevel: "debug" }}>
        <UsePerformer />
        <Rotate offset={offset}>
          <System key="1" content="A">
            {renderContent}
          </System>
          <System key="2" content="B">
            {renderContent}
          </System>
          <System key="3" content="C">
            {renderContent}
          </System>
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

    console.log("rotate right");
    rerender(renderApp(-1));
    await performer!.waitUntilSettled();

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

    console.log("rotate left");
    rerender(renderApp(1));
    await performer!.waitUntilSettled();

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

  test("should update message order when elements WITHOUT KEYS are reordered", async () => {
    function Rotate({ children, offset = 0 }: any) {
      return children.slice(offset).concat(children.slice(0, offset));
    }

    const renderApp = (offset: number) => (
      <Generative options={{ logLevel: "debug" }}>
        <UsePerformer />
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

    console.log("rotate right");
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

    console.log("rotate left");
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
    function Repeater({ times, children }: any) {
      return Array(times).fill(children).flat();
    }
    const renderApp = (times: number) => (
      <Generative options={{ logLevel: "debug" }}>
        <UsePerformer />
        <Repeater times={times}>
          <System content="A">{renderContent}</System>
        </Repeater>
      </Generative>
    );
    const { rerender, findAllByText, queryAllByText } = render(renderApp(2));
    await performer!.waitUntilSettled();
    let elements = await findAllByText("A");
    let messages = performer!.getAllMessages();
    expect(
      elements.map((e) => e.textContent),
      "Element content does match expected",
    ).toEqual(["A", "A"]);
    expect(
      elements.map((e) => e.textContent),
      "Element content does not match messages",
    ).toEqual(messages.map((m) => m.content));

    // remove 1
    rerender(renderApp(1));
    await performer!.waitUntilSettled();
    elements = await findAllByText("A");
    messages = performer!.getAllMessages();
    expect(
      elements.map((e) => e.textContent),
      "Element content does match expected",
    ).toEqual(["A"]);
    expect(
      elements.map((e) => e.textContent),
      "Element content does not match messages",
    ).toEqual(messages.map((m) => m.content));

    // remove all
    rerender(renderApp(0));
    await performer!.waitUntilSettled();
    elements = queryAllByText("A");
    messages = performer!.getAllMessages();
    expect(
      elements.map((e) => e.textContent),
      "Element content does match expected",
    ).toEqual([]);
    expect(
      elements.map((e) => e.textContent),
      "Element content does not match messages",
    ).toEqual(messages.map((m) => m.content));

    // add 4
    rerender(renderApp(4));
    await performer!.waitUntilSettled();
    elements = await findAllByText("A");
    messages = performer!.getAllMessages();
    expect(
      elements.map((e) => e.textContent),
      "Element content does match expected",
    ).toEqual(["A", "A", "A", "A"]);
    expect(
      elements.map((e) => e.textContent),
      "Element content does not match messages",
    ).toEqual(messages.map((m) => m.content));
    console.log("done");

    // remove 2
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
  }, 30_000);

  test("should unlink messages when removed by conditional", async () => {
    function Show({ when, children }: any) {
      return when ? children : null;
    }
    const renderApp = (when1: boolean, when2: boolean) => (
      <Generative options={{ logLevel: "debug" }}>
        <UsePerformer />
        <Show when={when1}>
          <System content="A" />
          <Show when={when2}>
            <System content="B" />
          </Show>
          <System content="C" />
        </Show>
      </Generative>
    );
    const { rerender, container } = render(renderApp(true, true));
    await performer!.waitUntilSettled();
    let messages = performer!.getAllMessages();
    expect(messages.map((m) => m.content)).toEqual(["A", "B", "C"]);

    rerender(renderApp(true, false));
    await performer!.waitUntilSettled();
    messages = performer!.getAllMessages();
    expect(messages.map((m) => m.content)).toEqual(["A", "C"]);

    rerender(renderApp(false, false));
    await performer!.waitUntilSettled();
    messages = performer!.getAllMessages();
    expect(messages.map((m) => m.content)).toEqual([]);

    rerender(renderApp(false, true));
    await performer!.waitUntilSettled();
    messages = performer!.getAllMessages();
    expect(messages.map((m) => m.content)).toEqual([]);
  });

  test("should wait for async message actions depth first", async () => {
    const after100ms = async (content: string) => {
      await sleep(100);
      return { role: "user" as const, content };
    };
    const renderApp = () => (
      <Generative options={{ logLevel: "debug" }}>
        <UsePerformer />
        <Message action={() => after100ms("A")}>
          {(message) => (
            <>
              {renderContent(message)}
              <Message action={() => after100ms("B")}>{renderContent}</Message>
            </>
          )}
        </Message>
        <System content="C">{renderContent}</System>
      </Generative>
    );

    const { container, findByText } = render(renderApp());
    // wait for A
    // await sleep(10_000);
    console.log(container.innerHTML);
    await findByText("A");
    let elements = container.querySelectorAll(`[data-performer-id]`);
    expect(Array.from(elements).map((e) => e.textContent)).toEqual([
      "A",
      "", // B should not be rendered yet
      "", // C should not be rendered yet
    ]);
    let messages = performer!.getAllMessages();
    expect(messages.map((m) => m.content)).toEqual(["A"]);
    await findByText("B");
    elements = container.querySelectorAll(`[data-performer-id]`);
    expect(Array.from(elements).map((e) => e.textContent)).toEqual([
      "AB", // A contains both A and B text content
      "B",
      "", // C should not be rendered yet
    ]);
    messages = performer!.getAllMessages();
    expect(messages.map((m) => m.content)).toEqual(["A", "B"]);
    await findByText("C");
    elements = container.querySelectorAll(`[data-performer-id]`);
    expect(Array.from(elements).map((e) => e.textContent)).toEqual([
      "AB", // A contains both A and B text content
      "B",
      "C",
    ]);
    messages = performer!.getAllMessages();
    expect(messages.map((m) => m.content)).toEqual(["A", "B", "C"]);
  }, 30_000);

  test("should bubble message action exceptions", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      class ErrorBoundary extends Component<
        { children?: ReactNode },
        { error: Error | null }
      > {
        public state: { error: Error | null } = {
          error: null,
        };
        public static getDerivedStateFromError(error: Error) {
          return { error };
        }
        public render() {
          return this.state.error ? (
            <div>{this.state.error.message}</div>
          ) : (
            this.props.children
          );
        }
      }
      const { findByText } = render(
        <Generative options={{ logLevel: "debug" }}>
          <ErrorBoundary>
            <Message
              action={() => {
                throw Error("A");
              }}
            />
          </ErrorBoundary>
        </Generative>,
      );
      const element = await findByText("A");
      expect(element.textContent).toEqual("A");
    } finally {
      // @ts-expect-error TS not aware of mock
      console.error.mockRestore();
    }
  });
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
});
