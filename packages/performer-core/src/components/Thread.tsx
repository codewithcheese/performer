import { Component } from "../component.js";
import { useAfterChildren, useResource, useThread } from "../hooks/index.js";
import { withResolvers } from "../util/with-resolvers.js";

type ThreadProps = {
  isolated?: boolean;
  // exposed?: boolean;
  // exposedOnSettled?: boolean;
  onSettled?: () => any;
  // onError
};

/**
 * Thread lets you create an independent execution thread.
 *
 * @param children
 * @param [isolated] - does not use parent messages
 * @param [onSettled] - called when all children have settled
 */
export const Thread: Component<ThreadProps> & { AwaitAll: Component<{}> } =
  function ({ children, onSettled, isolated = false }) {
    useThread({ isolated });
    useAfterChildren(() => {
      onSettled && onSettled();
    });
    return () => children;
  };

/**
 * Thread.AwaitAll lets you wait for multiple Thread's to be settled.
 */
Thread.AwaitAll = function AwaitAll({ children }) {
  const promises: Promise<any>[] = [];
  const attached = [children].flat().map((child) => {
    if (
      child !== null &&
      typeof child === "object" &&
      "type" in child &&
      child.type === Thread
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
