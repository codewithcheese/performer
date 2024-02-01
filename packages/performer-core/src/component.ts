import type { PerformerElement } from "./element.js";
import { createUseHook } from "./hooks/index.js";

export type Props = Record<string, any>;

export type View = () =>
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
      content?: string;
      controller?: AbortController;
    },
    use: ReturnType<typeof createUseHook>,
  ): View | Promise<View>;
};
