import { useHook } from "./use-hook.js";
import { Signal } from "@preact/signals-core";
import { useRenderScope } from "./use-render-scope.js";

export function useState<STATE extends unknown>(
  initialValue: STATE | (() => STATE),
): Signal<Readonly<STATE>> {
  const scope = useRenderScope();
  const key = `state-${scope.nonce++}` as const;
  if (initialValue instanceof Function) {
    initialValue = initialValue();
  }
  if (initialValue && typeof initialValue === "object") {
    Object.freeze(initialValue);
  }
  const { value } = useHook<Signal<Readonly<STATE>>>(
    key,
    new Signal(initialValue),
  );
  return value;
}

type StateHookKey = `state-${string}`;

export type StateHookRecord = {
  // more relaxed than unknown
  [key in StateHookKey]?: any;
};
