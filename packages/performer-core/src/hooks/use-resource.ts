import { RenderScope } from "./use-render-scope.js";

export type UseResourceHook = ReturnType<typeof createUseResourceHook>;

type UseResourceKey = `resource-${string}`;
type UseResourceState =
  | { type: "stream"; chunks: any[] }
  | { type: "value"; value: any };
export type UseHookRecord = {
  // more relaxed than unknown
  [key in UseResourceKey]?: UseResourceState;
};

export function createUseResourceHook(
  scope: RenderScope,
  controller: AbortController,
) {
  return async function useResource<
    T extends (controller: AbortController) => any,
  >(func: T): Promise<ReturnType<T>> {
    const key: UseResourceKey = `resource-${scope.nonce++}` as const;
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
        }) as ReturnType<T>;
      }
    }
    // call func
    const value = func(controller);
    const set = (newState: UseResourceState) => {
      scope.node.hooks[key] = newState;
    };
    if (value instanceof Promise) {
      return value.then((result) => {
        if (result instanceof ReadableStream) {
          return pipeThroughStream(result, set);
        }
        set({ type: "value", value: result });
        return result;
      });
    } else if (value instanceof ReadableStream) {
      return pipeThroughStream(value, set);
    }
    set({ type: "value", value });
    return value;
  };
}

function pipeThroughStream(value: any, set: (state: UseResourceState) => void) {
  const stream = { type: "stream" as const, chunks: [] as any[] };
  return value.pipeThrough(
    new TransformStream({
      transform(chunk: any, controller: TransformStreamDefaultController<any>) {
        stream.chunks.push(structuredClone(chunk));
        set(stream);
        controller.enqueue(chunk);
      },
    }),
  );
}