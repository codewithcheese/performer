import { MessageDelta, GenerativeMessage } from "./message.js";

export type ActionReturn =
  | ReadableStream<MessageDelta>
  | GenerativeMessage[]
  | GenerativeMessage
  | void
  | null
  | undefined
  | Promise<ActionReturn>;

export type ActionType = {
  ({
    messages,
    signal,
  }: {
    messages: GenerativeMessage[];
    signal: AbortSignal;
  }): ActionReturn;
};
