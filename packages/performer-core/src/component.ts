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

export type Component<P extends Props> = {
  // The main action function
  (
    props: P & {
      children?: PerformerElement | PerformerElement[] | string;
    },
  ): ComponentReturn;
};
