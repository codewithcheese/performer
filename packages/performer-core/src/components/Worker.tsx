import { Component } from "../component.js";
import { useAfterChildren, useResource, useWorker } from "../hooks/index.js";

type WorkerProps = {
  // isolate?: boolean;
  // include?: boolean;
  // includeOnSettled?: boolean;
  onSettled?: () => any;
};

export const Worker: Component<WorkerProps> = function ({
  children,
  onSettled,
}) {
  useWorker();
  useAfterChildren(() => {
    onSettled && onSettled();
  });
  return () => children;
};

// export const Wait: Component<{}> = function ({ children }) {
//   return () => {};
// };
//
// const Block: Component<{}> = function () {
//   useResource(() => new Promise(() => {}));
// };
