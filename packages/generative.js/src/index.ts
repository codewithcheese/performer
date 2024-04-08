declare global {
  var __DEV__: boolean;
}

(function () {
  if (typeof process !== "undefined" && process.env) {
    globalThis.__DEV__ =
      process.env.NODE_ENV === "development" || !!process.env.VITEST;
  } else {
    try {
      const { meta } = new Function("return import.meta")();
      globalThis.__DEV__ = meta.env.DEV;
    } catch (e) {
      globalThis.__DEV__ = false;
    }
  }
})();

export * from "./element.js";
export * from "./hooks/index.js";
export * from "./message.js";
export * from "./node.js";
export * from "./render.js";
export * from "./generative.js";
export * from "./components/index.js";
export * from "./tool.js";
export * from "./worker.js";
