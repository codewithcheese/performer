import { Component } from "../component.js";
import { useAfterChildren, useResource, useWorker } from "../hooks/index.js";
import { withResolvers } from "../util/with-resolvers.js";

type WorkerProps = {
  // isolated?: boolean;
  // exposed?: boolean;
  // exposedOnSettled?: boolean;
  onSettled?: () => any;
  // onError
};

export const Worker: Component<WorkerProps> & { AwaitAll: Component<{}> } =
  function ({ children, onSettled }) {
    useWorker();
    useAfterChildren(() => {
      onSettled && onSettled();
    });
    return () => children;
  };

Worker.AwaitAll = function AwaitAll({ children }) {
  const promises: Promise<any>[] = [];
  const attached = [children].flat().map((child) => {
    if (
      child !== null &&
      typeof child === "object" &&
      "type" in child &&
      child.type === Worker
    ) {
      const existingOnSettled = child.props.onSettled;
      const { promise, resolve } = withResolvers<void>();
      promises.push(promise);
      child.props.onSettled = () => {
        try {
          // trigger existing onSettled if set
          existingOnSettled && existingOnSettled();
        } finally {
          resolve();
        }
      };
    }
    return child;
  });
  return () => {
    return (
      <>
        {attached}
        <Await promise={Promise.all(promises)} />
      </>
    );
  };
};

const Await: Component<{ promise: Promise<any> }> = function ({ promise }) {
  useResource(() => promise);
  return () => {};
};
