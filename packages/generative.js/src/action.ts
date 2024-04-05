import { MessageDelta, PerformerMessage } from "./message.js";

export type ActionReturn =
  | ReadableStream<MessageDelta>
  | PerformerMessage[]
  | PerformerMessage
  | void
  | null
  | undefined
  | Promise<ActionReturn>;

export type ActionType = {
  ({
    messages,
    signal,
  }: {
    messages: PerformerMessage[];
    signal: AbortSignal;
  }): ActionReturn;
};
