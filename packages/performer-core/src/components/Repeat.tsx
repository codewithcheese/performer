import type { Component } from "../component.js";
import { useAfterChildren, useState } from "../hooks/index.js";
import { Signal } from "@preact/signals-core";

/**
 *	Repeat the children indefinitely unless limited using times prop or stopped with a signal.
 *
 *  Signal is used for stop instead of a boolean so that changing the stop does not cause Repeat to be recreated.
 *  If Repeat was recreated the `n` state would be lost.
 */
export const Repeat: Component<{ times?: number; stop?: Signal<boolean> }> = ({
  children,
  times = Infinity,
  stop = new Signal(false),
}) => {
  const n = useState(1);
  useAfterChildren(() => {
    if (!stop.peek() && n.peek() < times) {
      n.value += 1;
    }
  });
  return () => Array(n.value).fill(children).flat();
};
