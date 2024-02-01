import { useHook } from "./use-hook.js";
import { RenderScope } from "./use-render-scope.js";

export function createUseHook(scope: RenderScope, controller: AbortController) {
  return async function use<T extends (controller: AbortController) => any>(
    func: T,
  ): Promise<ReturnType<T>> {
    const key: ResourceHookKey = `use-${scope.nonce++}` as const;
    if (key in scope.node.hooks) {
      // return pre-existing value if set
      return scope.node.hooks[key];
    }
    // call func
    const value = func(controller);
    const { set } = useHook(key, value, scope);
    if (value instanceof Promise) {
      value.then((result) => set(result));
    }
    return value;
  };
}

export type UseHook = ReturnType<typeof createUseHook>;

type ResourceHookKey = `use-${string}`;
export type ResourceHookRecord = {
  // more relaxed than unknown
  [key in ResourceHookKey]?: any;
};
