import { MessageDelta, type PerformerMessage } from "../message.js";
import { ClientOptions, OpenAI } from "openai";
import { isEmptyObject } from "../util/is-empty-object.js";
import "../util/readable-stream-polyfill.js";
import { ReactNode, useCallback } from "react";
import { ActionType } from "../action.js";
import { Action } from "./Action.js";
import { ChatCompletionCreateParamsStreaming } from "openai/resources/index";

export function Assistant({
  model = "gpt-3.5-turbo",
  children,
  requestOptions = {},
  clientOptions = {},
}: {
  model?: string;
  children?: ReactNode;
  requestOptions?: Partial<ChatCompletionCreateParamsStreaming>;
  clientOptions?: ClientOptions;
}) {
  const action = useCallback<ActionType>(
    async ({ messages, signal }) =>
      fetchCompletion({
        model,
        messages,
        signal,
        requestOptions,
        clientOptions,
      }),
    [],
  );
  return <Action action={action}>{children}</Action>;
}

async function fetchCompletion({
  model = "gpt-3.5-turbo",
  messages,
  signal,
  requestOptions,
  clientOptions = {},
}: {
  model?: string;
  messages: PerformerMessage[];
  signal: AbortSignal;
  requestOptions?: Partial<ChatCompletionCreateParamsStreaming>;
  clientOptions?: ClientOptions;
}) {
  const openai = new OpenAI({
    dangerouslyAllowBrowser: true,
    ...clientOptions,
  });
  const stream = await openai.chat.completions.create(
    {
      model,
      messages,
      stream: true,
      ...requestOptions,
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
