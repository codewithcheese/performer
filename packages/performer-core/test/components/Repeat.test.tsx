/* @vitest-environment jsdom */
import { expect, test } from "vitest";
import {
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

test("node after repeat should not render until repeat is complete", async () => {
  const app = (
    <Generative options={{ logLevel: "debug" }}>
      <Repeat limit={2}>
        <System content="A">{readTextContent}</System>
      </Repeat>
      <System content="B">{readTextContent}</System>
    </Generative>
  );

  const { findByText, container } = render(app);
  await findByText("B");
  console.log(container.innerHTML);
}, 30_000);

test("should repeat until times prop is reached", async () => {
  const app = (
    <>
      <system>0</system>
      <Repeat times={1}>
        <system>A</system>
        <assistant>B</assistant>
        <Async>
          <user>C</user>
        </Async>
      </Repeat>
      <system>1</system>
      <Repeat times={2}>
        <system>D</system>
        <assistant>E</assistant>
        <Async>
          <user>F</user>
        </Async>
      </Repeat>
      <system>2</system>
    </>
  );
  const performer = new Performer(app);
  performer.start();
  await performer.waitUntilFinished();
  let messages = resolveMessages(performer.root);
  expect(messages).toHaveLength(1 + 1 * 3 + 1 + 2 * 3 + 1);
}, 30_000);

test("should stop repeating using stop prop", async () => {
  function App() {
    let count = 0; // no signal needed not used in view
    const stop = useState<boolean>(false);
    const onMessage = () => {
      count += 1;
      if (count >= 4) {
        stop.value = true;
      }
    };
    return () => (
      <>
        <system>0</system>
        <Repeat stop={stop}>
          <system onMessage={onMessage}>A</system>
          <assistant>B</assistant>
          <Async>
            <user>C</user>
          </Async>
        </Repeat>
        <system>1</system>
        <user>2</user>
      </>
    );
  }
  const performer = new Performer(<App />);
  performer.start();
  await performer.waitUntilFinished();
  const messages = resolveMessages(performer.root);
  expect(messages.length).toEqual(1 + 3 * 4 + 2);
}, 10_000);
