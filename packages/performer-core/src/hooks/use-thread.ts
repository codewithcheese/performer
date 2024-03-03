import { useHook } from "./use-hook.js";
import { useRenderScope } from "./use-render-scope.js";

type ThreadState = {
  id: string;
  isolated: boolean;
};

type UseThreadProps = { isolated: boolean };

export function useThread({ isolated }: UseThreadProps) {
  const scope = useRenderScope();
  const threadId = `${scope.node.threadId}/${scope.performer.threadNonce++}`;
  useHook<ThreadState>("thread", { id: threadId, isolated });
}

type ThreadHookKey = `thread`;

export type ThreadHookRecord = {
  // more relaxed than unknown
  [key in ThreadHookKey]?: ThreadState;
};
