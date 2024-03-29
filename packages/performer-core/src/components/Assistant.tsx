import { MessageDelta, type PerformerMessage } from "../message.js";
import { ClientOptions, OpenAI } from "openai";
import { isEmptyObject } from "../util/is-empty-object.js";
import "../util/readable-stream-polyfill.js";
import { ReactNode, useCallback } from "react";
import { Generative } from "./Generative.js";
import { Action } from "../action.js";

export function Assistant({
  model = "gpt-3.5-turbo",
  children,
  clientOptions = {},
}: {
  model?: string;
  children?: ReactNode;
  clientOptions?: ClientOptions;
}) {
  const action = useCallback<Action>(
    async ({ messages, signal }) =>
      fetchCompletion({ model, messages, signal, clientOptions }),
    [],
  );
  return <Generative action={action}>{children}</Generative>;
}

async function fetchCompletion({
  model = "gpt-3.5-turbo",
  messages,
  signal,
  clientOptions = {},
}: {
  model?: string;
  messages: PerformerMessage[];
  signal: AbortSignal;
  clientOptions?: ClientOptions;
}) {
  const openai = new OpenAI(clientOptions);
  const stream = await openai.chat.completions.create(
    {
      model,
      messages,
      stream: true,
    },
    { signal },
  );
  return new ReadableStream<MessageDelta>({
    async start(controller) {
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        if (!isEmptyObject(delta)) {
          controller.enqueue(delta);
        }
      }
      controller.close();
    },
  });
}
