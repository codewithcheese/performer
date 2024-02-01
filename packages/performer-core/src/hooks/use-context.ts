import { type PerformerNode, getNearestParent } from "../node.js";
import { useHook } from "./use-hook.js";
import { Signal } from "@preact/signals-core";

export interface ContextId<STATE> {
  readonly __context_type: STATE;
  readonly name: string;
}

export function createContextId<STATE = unknown>(
  name: string,
): ContextId<STATE> {
  return Object.freeze({
    name,
  } as any);
}

export function initContext<STATE extends unknown>(
  context: ContextId<STATE>,
  initValue: STATE,
) {
  const contextKey = `context-${context.name}` as const;
  const { value } = useHook<Signal<STATE>>(contextKey, new Signal(initValue));
  return value;
}

export function useContext<STATE extends unknown>(
  context: ContextId<STATE>,
): Signal<STATE> {
  const providerKey = `provider-${context.name}` as const;
  const contextKey = `context-${context.name}` as const;
  const { value, set, scope } = useHook<PerformerNode | undefined>(
    providerKey,
    undefined,
  );
  let provider = value;
  if (provider == null) {
    provider = getNearestParent(
      scope.node,
      (parent) => contextKey in parent.hooks,
    );
  }
  if (provider == null) {
    throw Error(`Provider not found for context "${contextKey}"`);
  }
  set(provider);
  return provider.hooks[contextKey] as Signal<STATE>;
}

export type ProviderHookKey = `provider-${string}`;
export type ContextHookKey = `context-${string}`;

export type ProviderHookRecord = {
  [key in ProviderHookKey]?: PerformerNode;
};

export type ContextHookRecord = {
  [key in ContextHookKey]?: unknown;
};
