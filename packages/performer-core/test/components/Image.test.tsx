import { describe, expect, test, assert } from "vitest";
import {
  Assistant,
  Image,
  isAssistantMessage,
  isImageContent,
  resolveMessages,
  Performer,
  User,
} from "../../src/index.js";

describe.skipIf(process.env.TEST_SLOW === undefined)("Image", () => {
  test("should create image without prompt", async () => {
    const app = (
      <>
        <system>You are a sports knowledge expert.</system>
        <User>Which is the most watched sport in the world?</User>
        <Assistant />
        <User>
          Draw a realistic image of a person with the things used to play this
          sport.
        </User>
        <Image />
      </>
    );
    const performer = new Performer({ element: app });
    performer.start();
    await performer.waitUntilSettled();
    const messages = resolveMessages(performer.node);
    expect(messages).toHaveLength(5);
    assert(isAssistantMessage(messages[4]));
    assert(isImageContent(messages[4].content[0]));
    console.log(messages[4].content[0].image_url);
  }, 60_000);

  test("should create image with predefined prompt", async () => {
    const app = <Image>A realistic rendition of the Spiderman meme.</Image>;
    const performer = new Performer({ element: app });
    performer.start();
    await performer.waitUntilSettled();
    const messages = resolveMessages(performer.node);
    expect(messages).toHaveLength(1);
    assert(isAssistantMessage(messages[0]));
    assert(isImageContent(messages[0].content[0]));
    console.log(messages[0].content[0].image_url);
  }, 60_000);

  test("should create image with instructions for prompt generation", async () => {
    const app = (
      <>
        <Image instructions="The image should be black and white.">
          A bowl of mangoes
        </Image>
      </>
    );
    const performer = new Performer({ element: app });
    performer.start();
    await performer.waitUntilSettled();
    const messages = resolveMessages(performer.node);
    expect(messages).toHaveLength(1);
    assert(isAssistantMessage(messages[0]));
    assert(isImageContent(messages[0].content[0]));
    console.log(messages[0].content[0].image_url);
  }, 60_000);

  test("should customize image generation parameters", async () => {
    const app = (
      <Image model="dall-e-2" numberOfImages={4}>
        An underwater farm growing fruit.
      </Image>
    );
    const performer = new Performer({ element: app });
    performer.start();
    await performer.waitUntilSettled();
    const messages = resolveMessages(performer.node);
    assert(isAssistantMessage(messages[0]));
    expect(messages[0].content).toHaveLength(4);
    assert(isImageContent(messages[0].content[0]));
    assert(isImageContent(messages[0].content[1]));
    assert(isImageContent(messages[0].content[2]));
    assert(isImageContent(messages[0].content[3]));
    console.log(messages[0].content[0].image_url);
    console.log(messages[0].content[1].image_url);
    console.log(messages[0].content[2].image_url);
    console.log(messages[0].content[3].image_url);
  }, 60_000);
});
