import { PerformerMessage } from "../message.js";
import { resolveMessages } from "../render.js";
import { useRenderScope } from "./use-render-scope.js";

export type MessageHook = PerformerMessage[];

export type UseMessagesHookRecord = {
  messages?: MessageHook;
};

export function useMessages() {
  const scope = useRenderScope();
  return resolveMessages(
    scope.performer.node,
    scope.node,
    scope.performer.logConfig,
  );
}
