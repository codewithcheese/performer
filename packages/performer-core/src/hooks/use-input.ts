import { useHook } from "./use-hook.js";
import { PerformerMessage } from "../message.js";
import { useRenderScope } from "./use-render-scope.js";
import type { PerformerNode } from "../node.js";

export type PendingInputState = {
  state: "pending";
  resolve: (
    value: PerformerMessage[] | PromiseLike<PerformerMessage[]>,
  ) => void;
  reject: (reason?: any) => void;
};

export type InputState =
  | PendingInputState
  | { state: "fulfilled"; value: PerformerMessage[] };

export async function useInput(): Promise<PerformerMessage[]> {
  const scope = useRenderScope();
  const key: InputHookKey = `input`;
  if (
    key in scope.node.hooks &&
    scope.node.hooks.input?.state === "fulfilled"
  ) {
    // return pre-existing value if set
    return scope.node.hooks[key]?.value;
  }
  const set = (state: InputState) => (scope.node.hooks.input = state);

  return new Promise<PerformerMessage[]>((resolve, reject) => {
    set({
      state: "pending",
      resolve,
      reject,
    });
  }).then((value) => {
    set({
      state: "fulfilled",
      value: value,
    });
    return value;
  });
}

type InputHookKey = `input`;
export type InputHookRecord = {
  input?: InputState;
};
