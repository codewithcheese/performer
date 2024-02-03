import { resolveMessages } from "../render.js";
import { useRenderScope } from "./use-render-scope.js";

export function useMessages() {
  const scope = useRenderScope();
  return resolveMessages(
    scope.performer.root,
    scope.node,
    scope.performer.logConfig,
  );
}
