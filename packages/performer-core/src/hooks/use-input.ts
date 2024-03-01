import { PerformerMessage } from "../message.js";
import { useRenderScope } from "./use-render-scope.js";
import { DeferInput } from "../util/defer.js";

export type PendingInputState = {
  state: "pending";
  resolve: (
    value: PerformerMessage[] | PromiseLike<PerformerMessage[]>,
  ) => void;
  reject: (reason?: any) => void;
};

export type InputState =
  | { state: "pending" }
  | { state: "fulfilled"; value: PerformerMessage[] };

export function useInput(): PerformerMessage[] {
  const scope = useRenderScope();
  const key: InputHookKey = `input`;
  if (key in scope.node.hooks && scope.node.hooks[key]?.state === "fulfilled") {
    // return fulfilled value
    return scope.node.hooks[key]?.value;
  }

  scope.node.hooks[key] = { state: "pending" };
  throw new DeferInput();
}

type InputHookKey = `input`;
export type InputHookRecord = {
  input?: InputState;
};
