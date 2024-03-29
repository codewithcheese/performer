import type { PerformerElement } from "./element.js";
import { MessageDelta, PerformerMessage } from "./message.js";

export type Props = Record<string, any>;

export type ComponentReturn =
  | ReadableStream<MessageDelta>
  | PerformerMessage[]
  | PerformerMessage
  | void
  | null
  | undefined
  | false
  | string
  | Promise<ComponentReturn>;

//
// export type Component<
//   P extends Props,
//   C extends Record<string, Component<any>> = {},
// > = {
//   (
//     props: P & {
//       children?: PerformerElement | PerformerElement[] | string;
//     },
//   ): ComponentReturn;
// } & C;

export type Component<P extends Props> = {
  (props: P): ComponentReturn;
};
