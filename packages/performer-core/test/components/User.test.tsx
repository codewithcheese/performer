import { assert, expect, test } from "vitest";
import {
  Assistant,
  isImageContent,
  isTextContent,
  Performer,
  resolveMessages,
  User,
  UserMessage,
  MessageEvent,
} from "../../src/index.js";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { testHydration } from "../util/test-hydration.js";

test("should accept user input", async () => {
  const userMessage: UserMessage = {
    role: "user",
    content: [{ type: "text", text: "Hello, world!" }],
  };
  const app = (
    <User onMessage={(message) => expect(message).toEqual(userMessage)} />
  );
  const performer = new Performer({ element: app });
  performer.start();
  expect(performer.hasFinished).toEqual(false);
  performer.input(new MessageEvent({ payload: userMessage }));
  await performer.waitUntilSettled();
  assert(performer.node?.type instanceof Function);
  expect(performer.node?.type.name).toEqual("User");
  const messages = resolveMessages(performer.node);
  expect(messages).toHaveLength(1);
  expect(messages[0].role).toEqual("user");
  assert(isTextContent(messages[0].content[0]));
  expect(messages[0].content[0].type).toEqual("text");
  expect(messages[0].content[0].text).toEqual("Hello, world!");
  await testHydration(performer);
});

test.skipIf(process.env.TEST_SLOW === undefined)(
  "should generate assistant response to user input",
  async () => {
    const gpt4v = new ChatOpenAI({ modelName: "gpt-4-vision-preview" });
    const app = (
      <>
        <User />
        <Assistant model={gpt4v} />
      </>
    );
    const performer = new Performer({
      element: app,
    });
    performer.start();
    await performer.waitUntilSettled();
    const imageUrl =
      "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Capybara_%28Hydrochoerus_hydrochaeris%29.JPG/1000px-Capybara_%28Hydrochoerus_hydrochaeris%29.JPG";
    performer.input(
      new MessageEvent({
        payload: {
          role: "user",
          content: [
            { type: "text", text: "What is the animal in the image?" },
            {
              type: "image_url",
              image_url: imageUrl,
            },
          ],
        },
      }),
    );
    await performer.waitUntilFinished;
    assert(performer.node?.child?.type instanceof Function);
    expect(performer.node?.child?.type.name).toEqual("User");
    const messages = resolveMessages(performer.node);
    expect(messages).toHaveLength(2);
    assert(isTextContent(messages[0].content[0]));
    expect(messages[0].content[0].type).toEqual("text");
    expect(messages[0].content[0].text).toEqual(
      "What is the animal in the image?",
    );
    assert(isImageContent(messages[0].content[1]));
    expect(messages[0].content[1].type).toEqual("image_url");
    expect(messages[0].content[1].image_url).toEqual(imageUrl);
    assert(performer.node?.child?.nextSibling?.type instanceof Function);
    expect(performer.node?.child?.nextSibling!.type.name).toEqual("Assistant");
  },
  30_000,
);
