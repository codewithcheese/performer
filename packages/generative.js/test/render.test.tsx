/* @vitest-environment jsdom */
import { expect, it, test, vi } from "vitest";
import {
  GenerativeProvider,
  Message,
  MessageDelta,
  GenerativeMessage,
  readTextContent,
  Repeat,
  System,
} from "../src/index.js";
import { sleep } from "openai/core";
import { findByText, render } from "@testing-library/react";
import { ErrorBoundary } from "./util/ErrorBoundary.js";
import { getGenerative, UseGenerative } from "./util/UseGenerative.js";

it("should call actions depth first", async () => {
  let siblingActioned = false;
  const { findByText } = render(
    <GenerativeProvider options={{ logLevel: "debug" }}>
      <Message type={() => ({ role: "user", content: "A" })}>
        <Message type={() => ({ role: "assistant", content: "B" })} />
      </Message>
      <Message
        type={({ messages }) => {
          siblingActioned = true;
          expect(messages).toEqual([
            { role: "user", content: "A" },
            { role: "assistant", content: "B" },
          ]);
        }}
      >
        Done
      </Message>
    </GenerativeProvider>,
  );
  await findByText("Done");
  expect(siblingActioned).toEqual(true);
});

it("should render repeat with limit", async () => {
  let testActioned = false;
  const TestMessages = () => {
    return (
      <Message
        type={({ messages, signal }) => {
          testActioned = true;
          expect(messages.map((m) => m.content)).toEqual(["1", "2", "1", "2"]);
        }}
      >
        3
      </Message>
    );
  };

  const { findByText, container } = render(
    <GenerativeProvider options={{ logLevel: "debug" }}>
      <Repeat limit={2}>
        <System content="1">1</System>
        <System content="2">2</System>
      </Repeat>
      <TestMessages />
    </GenerativeProvider>,
  );
  await findByText("3");
  console.log(container.innerHTML);
  expect(testActioned).toEqual(true);
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
      <Message type={streamAction}>
        {(message) => {
          // console.log("Render streamer", message);
          return readTextContent(message) + "!";
        }}
      </Message>
    );
  }

  const { findByText } = render(
    <GenerativeProvider options={{ logLevel: "debug" }}>
      <Streamer />
    </GenerativeProvider>,
  );
  await findByText("A!");
  await sleep(500);
  await findByText("ABCDE!");
});

test("should update when message prop changes", async () => {
  const app = (
    <GenerativeProvider options={{ logLevel: "debug" }}>
      <System content={"A"}>{(message) => readTextContent(message)}</System>
    </GenerativeProvider>
  );
  const { rerender, findByText } = render(app);
  await findByText("A");
  rerender(
    <GenerativeProvider options={{ logLevel: "debug" }}>
      <System content={"B"}>{(message) => readTextContent(message)}</System>
    </GenerativeProvider>,
  );
  await findByText("B");
});

test("should update message order when elements WITH KEYS are reordered", async () => {
  function Rotate({ children, offset = 0 }: any) {
    return children.slice(offset).concat(children.slice(0, offset));
  }

  const renderContent = (message: GenerativeMessage) =>
    readTextContent(message);

  const renderApp = (offset: number) => (
    <GenerativeProvider options={{ logLevel: "debug" }}>
      <UseGenerative />
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
    </GenerativeProvider>
  );

  const { rerender, findByText } = render(renderApp(0));
  const generative = getGenerative()!;

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

  let messages = generative.getAllMessages();
  expect(messages.map((m) => m.content)).toEqual(["A", "B", "C"]);

  console.log("rotate right");
  rerender(renderApp(-1));
  await generative.waitUntilSettled();

  elementA = await findByText("A");
  elementB = await findByText("B");
  elementC = await findByText("C");

  expect(elementA.compareDocumentPosition(elementB)).toBe(
    Node.DOCUMENT_POSITION_FOLLOWING,
  );
  expect(elementC.compareDocumentPosition(elementA)).toBe(
    Node.DOCUMENT_POSITION_FOLLOWING,
  );

  messages = generative.getAllMessages();
  expect(messages.map((m) => m.content)).toEqual(["C", "A", "B"]);

  console.log("rotate left");
  rerender(renderApp(1));
  await generative.waitUntilSettled();

  elementA = await findByText("A");
  elementB = await findByText("B");
  elementC = await findByText("C");

  expect(elementB.compareDocumentPosition(elementC)).toBe(
    Node.DOCUMENT_POSITION_FOLLOWING,
  );
  expect(elementC.compareDocumentPosition(elementA)).toBe(
    Node.DOCUMENT_POSITION_FOLLOWING,
  );

  messages = generative.getAllMessages();
  expect(messages.map((m) => m.content)).toEqual(["B", "C", "A"]);
});

test("should update message order when elements WITHOUT KEYS are reordered", async () => {
  function Rotate({ children, offset = 0 }: any) {
    return children.slice(offset).concat(children.slice(0, offset));
  }

  const renderApp = (offset: number) => (
    <GenerativeProvider options={{ logLevel: "debug" }}>
      <UseGenerative />
      <Rotate offset={offset}>
        <System content="A">{readTextContent}</System>
        <System content="B">{readTextContent}</System>
        <System content="C">{readTextContent}</System>
      </Rotate>
    </GenerativeProvider>
  );

  const { rerender, findByText } = render(renderApp(0));
  const generative = getGenerative()!;

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

  let messages = generative.getAllMessages();
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

  messages = generative.getAllMessages();
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

  messages = generative.getAllMessages();
  expect(messages.map((m) => m.content)).toEqual(["B", "C", "A"]);
});

test("should render new elements when dynamically added or removed", async () => {
  function Repeater({ times, children }: any) {
    return Array(times).fill(children).flat();
  }
  const renderApp = (times: number) => (
    <GenerativeProvider options={{ logLevel: "debug" }}>
      <UseGenerative />
      <Repeater times={times}>
        <System content="A">{readTextContent}</System>
      </Repeater>
    </GenerativeProvider>
  );
  const { rerender, findAllByText, queryAllByText } = render(renderApp(2));
  const generative = getGenerative()!;
  await generative.waitUntilSettled();
  let elements = await findAllByText("A");
  let messages = generative.getAllMessages();
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
  await generative.waitUntilSettled();
  elements = await findAllByText("A");
  messages = generative.getAllMessages();
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
  await generative.waitUntilSettled();
  elements = queryAllByText("A");
  messages = generative.getAllMessages();
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
  await generative.waitUntilSettled();
  elements = await findAllByText("A");
  messages = generative.getAllMessages();
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
  await generative.waitUntilSettled();
  elements = await findAllByText("A");
  messages = generative.getAllMessages();
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
    <GenerativeProvider options={{ logLevel: "debug" }}>
      <UseGenerative />
      <Show when={when1}>
        <System content="A" />
        <Show when={when2}>
          <System content="B" />
        </Show>
        <System content="C" />
      </Show>
    </GenerativeProvider>
  );
  const { rerender, container } = render(renderApp(true, true));
  const generative = getGenerative()!;
  await generative.waitUntilSettled();
  let messages = generative.getAllMessages();
  expect(messages.map((m) => m.content)).toEqual(["A", "B", "C"]);

  rerender(renderApp(true, false));
  await generative.waitUntilSettled();
  messages = generative.getAllMessages();
  expect(messages.map((m) => m.content)).toEqual(["A", "C"]);

  rerender(renderApp(false, false));
  await generative.waitUntilSettled();
  messages = generative.getAllMessages();
  expect(messages.map((m) => m.content)).toEqual([]);

  rerender(renderApp(false, true));
  await generative.waitUntilSettled();
  messages = generative.getAllMessages();
  expect(messages.map((m) => m.content)).toEqual([]);
});

test("should wait for async message actions depth first", async () => {
  const after100ms = async (content: string) => {
    await sleep(100);
    return { role: "user" as const, content };
  };
  const renderApp = () => (
    <GenerativeProvider options={{ logLevel: "debug" }}>
      <UseGenerative />
      <Message type={() => after100ms("A")}>
        {(message) => (
          <>
            {readTextContent(message)}
            <Message type={() => after100ms("B")}>{readTextContent}</Message>
          </>
        )}
      </Message>
      <System content="C">{readTextContent}</System>
    </GenerativeProvider>
  );

  const { container, findByText } = render(renderApp());
  const generative = getGenerative()!;
  // wait for A
  // await sleep(10_000);
  console.log(container.innerHTML);
  await findByText("A");
  let elements = container.querySelectorAll(`[data-generative-id]`);
  expect(Array.from(elements).map((e) => e.textContent)).toEqual([
    "A",
    "", // B should not be rendered yet
    "", // C should not be rendered yet
  ]);
  let messages = generative.getAllMessages();
  expect(messages.map((m) => m.content)).toEqual(["A"]);
  await findByText("B");
  elements = container.querySelectorAll(`[data-generative-id]`);
  expect(Array.from(elements).map((e) => e.textContent)).toEqual([
    "AB", // A contains both A and B text content
    "B",
    "", // C should not be rendered yet
  ]);
  messages = generative.getAllMessages();
  expect(messages.map((m) => m.content)).toEqual(["A", "B"]);
  await findByText("C");
  elements = container.querySelectorAll(`[data-generative-id]`);
  expect(Array.from(elements).map((e) => e.textContent)).toEqual([
    "AB", // A contains both A and B text content
    "B",
    "C",
  ]);
  messages = generative.getAllMessages();
  expect(messages.map((m) => m.content)).toEqual(["A", "B", "C"]);
}, 10_000);

test("should bubble message action exceptions", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  try {
    let { findByText, queryByText } = render(
      <GenerativeProvider options={{ logLevel: "debug" }}>
        <ErrorBoundary>
          <Message
            type={() => {
              throw Error("A");
            }}
          >
            <Message type={() => ({ role: "user" as const, content: "B" })}>
              {readTextContent}
            </Message>
          </Message>
        </ErrorBoundary>
        <Message type={() => ({ role: "user" as const, content: "C" })}>
          {readTextContent}
        </Message>
      </GenerativeProvider>,
    );
    let element = await findByText("A");
    expect(element.textContent).toEqual("A");
    expect(
      queryByText("B"),
      "Children of exception should not be rendered",
    ).toEqual(null);
    await findByText("C");

    // try nested throw
    ({ findByText } = render(
      <GenerativeProvider options={{ logLevel: "debug" }}>
        <ErrorBoundary>
          <Message type={() => ({ role: "user" as const, content: "A" })}>
            <Message
              type={() => {
                throw Error("B");
              }}
            />
          </Message>
        </ErrorBoundary>
      </GenerativeProvider>,
    ));
    element = await findByText("B");
    expect(element.textContent).toEqual("B");
  } finally {
    // @ts-expect-error TS not aware of mock
    console.error.mockRestore();
  }
});
