import { useHook } from "./use-hook.js";

export function useAfterChildren(callback: () => void | boolean) {
  useHook<() => void>("afterChildren", callback);
}

type AfterChildrenHookKey = `afterChildren`;

export type AfterChildrenHookRecord = {
  // more relaxed than unknown
  [key in AfterChildrenHookKey]?: () => boolean;
};
