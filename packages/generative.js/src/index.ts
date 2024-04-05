declare global {
  var __DEV__: boolean;
}

(function () {
  if (typeof process !== "undefined" && process.env) {
    globalThis.__DEV__ =
      process.env.NODE_ENV === "development" || !!process.env.VITEST;
  } else if (typeof import.meta !== "undefined" && import.meta.env) {
    globalThis.__DEV__ = import.meta.env.DEV;
  } else {
    globalThis.__DEV__ = false;
  }
})();

export * from "./element.js";
export * from "./hooks/index.js";
export * from "./message.js";
export * from "./node.js";
export * from "./render.js";
export * from "./performer.js";
export * from "./components/index.js";
export * from "./tool.js";
