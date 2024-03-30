import { getEnv } from "./util/env.js";

declare global {
  var __DEV__: boolean;
}

globalThis.__DEV__ = getEnv("NODE_ENV") === "development" || !!getEnv("VITEST");

export * from "./component.js";
export * from "./element.js";
export * from "./event.js";
export * from "./hooks/index.js";
export * from "./message.js";
export * from "./node.js";
export * from "./render.js";
export * from "./performer.js";
export * from "./components/index.js";
export * from "./hydration.js";
export * from "./tool.js";
