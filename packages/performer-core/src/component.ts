import type { PerformerElement } from "./element.js";
import { PerformerMessage } from "./message.js";

export type Props = Record<string, any>;

export type ComponentReturn =
  | PerformerMessage[]
  | PerformerMessage
  | void
  | null
  | undefined
  | false
  | string;
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
