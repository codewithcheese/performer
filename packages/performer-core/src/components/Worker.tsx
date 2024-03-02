import { Component } from "../component.js";
import { useWorker } from "../hooks/index.js";

export const Worker: Component<{}> = function ({ children }) {
  useWorker();
  return () => children;
};
