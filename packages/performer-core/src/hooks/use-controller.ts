import { useRenderScope } from "./use-render-scope.js";

export function useController() {
  const scope = useRenderScope();
  return scope.controller;
}
