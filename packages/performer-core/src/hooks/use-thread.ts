import { useHook } from "./use-hook.js";
import { useRenderScope } from "./use-render-scope.js";

export function useThread() {
  const scope = useRenderScope();
  const thread = `${scope.node.thread}/${scope.performer.threadNonce++}`;
  useHook<string>("thread", thread);
}

type ThreadHookKey = `thread`;

export type ThreadHookRecord = {
  // more relaxed than unknown
  [key in ThreadHookKey]?: string;
};
