import type { PerformerElement } from "./element.js";
import { createUseResourceHook } from "./hooks/index.js";

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
    asyncHooks: { useResource: ReturnType<typeof createUseResourceHook> },
  ): View | Promise<View>;
};
