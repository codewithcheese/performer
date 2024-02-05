import { type PerformerNode, getNearestParent } from "../node.js";
import { useHook } from "./use-hook.js";
import { Signal } from "@preact/signals-core";
import { assertTrue } from "../util/assert.js";

export interface Context<STATE> {
  readonly __context_type: STATE;
  readonly name: string;
}

export function createContext<STATE = unknown>(name: string): Context<STATE> {
  assertTrue(
    /^[\w/.-]+$/.test(name),
    `Context name "${name}" must only contain A-Z,a-z,0-9, _, -`,
  );
  return Object.freeze({
    name,
  } as any);
}

export function initContext<STATE extends unknown>(
  context: Context<STATE>,
  initValue: STATE,
) {
  const contextKey = `context-${context.name}` as const;
  const { value } = useHook<Signal<STATE>>(contextKey, new Signal(initValue));
  return value;
}

export function useContext<STATE extends unknown>(
  context: Context<STATE>,
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
