/* @vitest-environment jsdom */
import { expect, it, test, vi } from "vitest";
import {
  Generative,
  Message,
  MessageDelta,
  PerformerMessage,
  readTextContent,
  Repeat,
  System,
} from "../src/index.js";
import { sleep } from "openai/core";
import { findByText, render } from "@testing-library/react";
import { ErrorBoundary } from "./util/ErrorBoundary.js";
import { getPerformer, UsePerformer } from "./util/UsePerformer.js";

it("should call actions depth first", async () => {
  let siblingActioned = false;
  const { findByText } = render(
    <Generative options={{ logLevel: "debug" }}>
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
    </Generative>,
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
    <Generative options={{ logLevel: "debug" }}>
      <Repeat limit={2}>
        <System content="1">1</System>
        <System content="2">2</System>
      </Repeat>
      <TestMessages />
    </Generative>,
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

test("should update message order when elements WITH KEYS are reordered", async () => {
  function Rotate({ children, offset = 0 }: any) {
    return children.slice(offset).concat(children.slice(0, offset));
  }

  const renderContent = (message: PerformerMessage) => readTextContent(message);

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
  const performer = getPerformer()!;

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

  let messages = performer.getAllMessages();
  expect(messages.map((m) => m.content)).toEqual(["A", "B", "C"]);

  console.log("rotate right");
  rerender(renderApp(-1));
  await performer.waitUntilSettled();

  elementA = await findByText("A");
  elementB = await findByText("B");
  elementC = await findByText("C");

  expect(elementA.compareDocumentPosition(elementB)).toBe(
    Node.DOCUMENT_POSITION_FOLLOWING,
  );
  expect(elementC.compareDocumentPosition(elementA)).toBe(
    Node.DOCUMENT_POSITION_FOLLOWING,
  );

  messages = performer.getAllMessages();
  expect(messages.map((m) => m.content)).toEqual(["C", "A", "B"]);

  console.log("rotate left");
  rerender(renderApp(1));
  await performer.waitUntilSettled();

  elementA = await findByText("A");
  elementB = await findByText("B");
  elementC = await findByText("C");

  expect(elementB.compareDocumentPosition(elementC)).toBe(
    Node.DOCUMENT_POSITION_FOLLOWING,
  );
  expect(elementC.compareDocumentPosition(elementA)).toBe(
    Node.DOCUMENT_POSITION_FOLLOWING,
  );

  messages = performer.getAllMessages();
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
        <System content="A">{readTextContent}</System>
        <System content="B">{readTextContent}</System>
        <System content="C">{readTextContent}</System>
      </Rotate>
    </Generative>
  );

  const { rerender, findByText } = render(renderApp(0));
  const performer = getPerformer()!;

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

  let messages = performer.getAllMessages();
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

  messages = performer.getAllMessages();
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

  messages = performer.getAllMessages();
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
        <System content="A">{readTextContent}</System>
      </Repeater>
    </Generative>
  );
  const { rerender, findAllByText, queryAllByText } = render(renderApp(2));
  const performer = getPerformer()!;
  await performer.waitUntilSettled();
  let elements = await findAllByText("A");
  let messages = performer.getAllMessages();
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
  await performer.waitUntilSettled();
  elements = await findAllByText("A");
  messages = performer.getAllMessages();
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
  await performer.waitUntilSettled();
  elements = queryAllByText("A");
  messages = performer.getAllMessages();
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
  await performer.waitUntilSettled();
  elements = await findAllByText("A");
  messages = performer.getAllMessages();
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
  await performer.waitUntilSettled();
  elements = await findAllByText("A");
  messages = performer.getAllMessages();
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
  const performer = getPerformer()!;
  await performer.waitUntilSettled();
  let messages = performer.getAllMessages();
  expect(messages.map((m) => m.content)).toEqual(["A", "B", "C"]);

  rerender(renderApp(true, false));
  await performer.waitUntilSettled();
  messages = performer.getAllMessages();
  expect(messages.map((m) => m.content)).toEqual(["A", "C"]);

  rerender(renderApp(false, false));
  await performer.waitUntilSettled();
  messages = performer.getAllMessages();
  expect(messages.map((m) => m.content)).toEqual([]);

  rerender(renderApp(false, true));
  await performer.waitUntilSettled();
  messages = performer.getAllMessages();
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
      <Message type={() => after100ms("A")}>
        {(message) => (
          <>
            {readTextContent(message)}
            <Message type={() => after100ms("B")}>{readTextContent}</Message>
          </>
        )}
      </Message>
      <System content="C">{readTextContent}</System>
    </Generative>
  );

  const { container, findByText } = render(renderApp());
  const performer = getPerformer()!;
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
  let messages = performer.getAllMessages();
  expect(messages.map((m) => m.content)).toEqual(["A"]);
  await findByText("B");
  elements = container.querySelectorAll(`[data-performer-id]`);
  expect(Array.from(elements).map((e) => e.textContent)).toEqual([
    "AB", // A contains both A and B text content
    "B",
    "", // C should not be rendered yet
  ]);
  messages = performer.getAllMessages();
  expect(messages.map((m) => m.content)).toEqual(["A", "B"]);
  await findByText("C");
  elements = container.querySelectorAll(`[data-performer-id]`);
  expect(Array.from(elements).map((e) => e.textContent)).toEqual([
    "AB", // A contains both A and B text content
    "B",
    "C",
  ]);
  messages = performer.getAllMessages();
  expect(messages.map((m) => m.content)).toEqual(["A", "B", "C"]);
}, 30_000);

test("should bubble message action exceptions", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  try {
    let { findByText, queryByText } = render(
      <Generative options={{ logLevel: "debug" }}>
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
      </Generative>,
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
      <Generative options={{ logLevel: "debug" }}>
        <ErrorBoundary>
          <Message type={() => ({ role: "user" as const, content: "A" })}>
            <Message
              type={() => {
                throw Error("B");
              }}
            />
          </Message>
        </ErrorBoundary>
      </Generative>,
    ));
    element = await findByText("B");
    expect(element.textContent).toEqual("B");
  } finally {
    // @ts-expect-error TS not aware of mock
    console.error.mockRestore();
  }
});
