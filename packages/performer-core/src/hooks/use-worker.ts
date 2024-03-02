import { useHook } from "./use-hook.js";

export function useWorker() {
  useHook<string>("worker", crypto.randomUUID());
}

type WorkerHookKey = `worker`;

export type WorkerHookRecord = {
  // more relaxed than unknown
  [key in WorkerHookKey]?: string;
};
