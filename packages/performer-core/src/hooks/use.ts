import { useRenderScope } from "./use-render-scope.js";
import { DeferResource } from "../util/defer.js";

type UseKey = `resource-${string}`;
type UseState =
  | { type: "stream"; chunks: any[] }
  | { type: "value"; value: any; chunks?: [] };
export type UseHookRecord = {
  [key in UseKey]?: UseState;
};

export function use<
  T extends (controller: AbortController, ...rest: Args) => any,
  Args extends any[],
>(fetcher: T, ...args: Args): Awaited<ReturnType<T>> {
  const scope = useRenderScope();
  const key: UseKey = `resource-${scope.nonce++}` as const;
  const state = scope.node.hooks[key];
  if (state) {
    // return existing state
    if (state.type === "value") {
      return state.value;
    } else {
      return new ReadableStream({
        start(controller) {
          state.chunks.forEach((chunk) => controller.enqueue(chunk));
          controller.close();
        },
      }) as Awaited<ReturnType<T>>;
    }
  }
  // call fetcher
  const value = fetcher(scope.controller, ...args);
  const set = (newState: UseState) => {
    scope.node.hooks[key] = newState;
  };
  if (value instanceof Promise) {
    value.then((result) => {
      if (result instanceof ReadableStream) {
        return pipeThroughStream(result, set);
      } else {
        set({ type: "value", value: result });
        return result;
      }
    });
    throw new DeferResource(value);
  } else if (value instanceof ReadableStream) {
    return pipeThroughStream(value, set);
  }
  set({ type: "value", value });
  return value;
}

function pipeThroughStream(value: any, set: (state: UseState) => void) {
  const chunks: any[] = [];
  const stream = value.pipeThrough(
    new TransformStream({
      start() {},
      transform(chunk: any, controller: TransformStreamDefaultController<any>) {
        chunks.push(structuredClone(chunk));
        controller.enqueue(chunk);
      },
      flush() {
        set({ type: "stream", chunks });
      },
    }),
  );
  set({ type: "value", value: stream });
  return stream;
}
