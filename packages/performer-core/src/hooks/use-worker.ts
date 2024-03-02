import { useHook } from "./use-hook.js";
import { useRenderScope } from "./use-render-scope.js";

export function useWorker() {
  const scope = useRenderScope();
  const worker = `${scope.node.worker}/${scope.performer.workerNonce++}`;
  useHook<string>("worker", worker);
}

type WorkerHookKey = `worker`;

export type WorkerHookRecord = {
  // more relaxed than unknown
  [key in WorkerHookKey]?: string;
};
