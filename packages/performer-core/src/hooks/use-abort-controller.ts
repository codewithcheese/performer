import { useRenderScope } from "./use-render-scope.js";

export function useAbortController() {
  const scope = useRenderScope();
  return scope.abortController;
}
