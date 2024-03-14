import { useHook } from "./use-hook.js";
import { useRenderScope } from "./use-render-scope.js";

export type ThreadState = {
  id: string;
  isolated: boolean;
  exposed: boolean;
};

type UseThreadProps = { isolated: boolean; exposed: boolean };

export function useThread({ isolated, exposed }: UseThreadProps) {
  const scope = useRenderScope();
  const threadId = `${scope.node.threadId}/${scope.performer.threadNonce++}`;
  useHook<ThreadState>("thread", { id: threadId, isolated, exposed });
}

type ThreadHookKey = `thread`;

export type ThreadHookRecord = {
  // more relaxed than unknown
  [key in ThreadHookKey]?: ThreadState;
};
