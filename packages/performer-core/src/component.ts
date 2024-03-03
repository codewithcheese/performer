import type { PerformerElement } from "./element.js";

export type Props = Record<string, any>;

export type ComponentReturn = () =>
  | PerformerElement[]
  | PerformerElement
  | void
  | null
  | undefined
  | false
  | string;

export type Component<
  P extends Props,
  C extends Record<string, Component<any>> = {},
> = {
  (
    props: P & {
      children?: PerformerElement | PerformerElement[] | string;
    },
  ): ComponentReturn;
} & C;
