import { useHook } from "./use-hook.js";
import { Signal } from "@preact/signals-core";
import { useRenderScope } from "./use-render-scope.js";

export function useState<STATE extends unknown>(
  initState: STATE | (() => STATE),
): Signal<STATE> {
  const scope = useRenderScope();
  const key = `state-${scope.nonce++}` as const;
  if (initState instanceof Function) {
    initState = initState();
  }
  const { value } = useHook<Signal<STATE>>(key, new Signal(initState));
  return value;
}

type StateHookKey = `state-${string}`;

export type StateHookRecord = {
  // more relaxed than unknown
  [key in StateHookKey]?: any;
};
