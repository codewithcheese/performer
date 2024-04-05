/* @vitest-environment jsdom */
import { expect, test } from "vitest";
import {
  Assistant,
  Generative,
  Message,
  Performer,
  PerformerMessage,
  readTextContent,
  Repeat,
  resolveMessages,
  System,
  User,
} from "../../src/index.js";
import { sleep } from "../../src/util/sleep.js";
import { render } from "@testing-library/react";
import { getPerformer, UsePerformer } from "../util/UsePerformer.js";

function Async({ children }: any) {
  return (
    <Message
      type={async () => {
        await sleep(1);
      }}
    >
      {children}
    </Message>
  );
}

test("should support nested repeat", async () => {
  const app = (
    <Generative>
      <UsePerformer />
      <System content="-1">{readTextContent}</System>
      <Repeat limit={2}>
        <System content="0">{readTextContent}</System>
        <Repeat limit={3}>
          <Async>
            <User content="1">{readTextContent}</User>
            <Repeat limit={4}>
              <Async>
                <User content="2">{readTextContent}</User>
              </Async>
            </Repeat>
          </Async>
        </Repeat>
        <System content="3">{readTextContent}</System>
      </Repeat>
      <System content="4">{readTextContent}</System>
    </Generative>
  );
  const {} = render(app);
  const performer = getPerformer()!;
  await performer.waitUntilSettled();

  const messages = performer.getAllMessages();
  const countOccurrence = (list: PerformerMessage[], content: string) =>
    list.filter((m) => m.content === content).length;
  expect(countOccurrence(messages, "-1")).toEqual(1);
  expect(countOccurrence(messages, "0")).toEqual(2);
  expect(countOccurrence(messages, "1")).toEqual(2 * 3);
  expect(countOccurrence(messages, "2")).toEqual(2 * 3 * 4);
  expect(countOccurrence(messages, "3")).toEqual(2);
  expect(countOccurrence(messages, "4")).toEqual(1);
}, 10_000);

test("should render all iterations before next message", async () => {
  const app = (
    <Generative options={{ logLevel: "info" }}>
      <Repeat limit={2}>
        <System content="A">{readTextContent}</System>
      </Repeat>
      <System content="B">{readTextContent}</System>
    </Generative>
  );

  const { findByText, container, queryAllByText } = render(app);
  await findByText("B");
  const elements = queryAllByText("A");
  expect(elements).toHaveLength(2);
}, 30_000);

test("should not repeat when stopped", async () => {
  const renderApp = (stopped: boolean) => (
    <Generative>
      <System content="0">{readTextContent}</System>
      <Repeat stopped={stopped}>
        <System content="2">{readTextContent}</System>
      </Repeat>
      <System content="1">{readTextContent}</System>
    </Generative>
  );
  const { findByText, queryAllByText } = render(renderApp(true));
  await findByText("1");
  const elements = queryAllByText("2");
  expect(elements).toHaveLength(1);
}, 10_000);
