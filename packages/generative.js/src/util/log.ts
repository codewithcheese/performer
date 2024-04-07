import { ConsolaOptions, createConsola, LogLevels, LogType } from "consola";

let options: Partial<ConsolaOptions & { fancy: boolean }> = {};

// if (
//   typeof globalThis.window !== "undefined" &&
//   typeof globalThis.process === "undefined"
// ) {
//   // Running in a browser environment (excluding jsdom)
//   const { BrowserReporter } = await import("./consola-browser-reporter.js");
//   options.reporters = [new BrowserReporter({})];
// } else {
//   // Running in a Node.js environment or jsdom
//   const { NodeReporter } = await import("./consola-node-reporter.js");
//   options.reporters = [new NodeReporter()];
// }

export const logger = createConsola(options);

export function getLogger(tag: string) {
  return logger.withTag(tag);
}

export function setLogLevel(level: LogType) {
  logger.level = LogLevels[level];
}
