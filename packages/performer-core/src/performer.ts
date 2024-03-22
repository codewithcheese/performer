import type { PerformerElement } from "./element.js";
import type { PerformerNode } from "./node.js";
import { render, resolveMessages } from "./render.js";
import {
  createErrorEvent,
  createLifecycleEvent,
  PerformerErrorEvent,
  PerformerEventMap,
} from "./event.js";
import type { PerformerMessage } from "./message.js";
import { logEvent, logger, nodeToStr, toLogFmt } from "./util/log.js";
import { getEnv } from "./util/env.js";
import { LogLevels, type LogType } from "consola";
import Emittery from "emittery";

export type PerformerOptions = {
  throwOnError?: boolean;
  logLevel?: LogType;
};

export type PerformerState = "pending" | "settled" | "rendering" | "listening";

export class Performer {
  #uid: string;

  app: PerformerElement;
  root?: PerformerNode;
  options: PerformerOptions;
  errors: PerformerErrorEvent[] = [];
  state: PerformerState = "pending";

  // todo add deadline
  inputQueue: PerformerMessage[] = [];
  inputNode: PerformerNode | undefined;

  abortController = new AbortController();

  renderQueued = false;
  renderInProgress: boolean = false;

  threadNonce = 0;

  emitter = new Emittery<PerformerEventMap>();

  constructor(app: PerformerElement, options: PerformerOptions = {}) {
    this.#uid = crypto.randomUUID();
    this.app = app;
    this.options = options;
    const logLevel: LogType =
      (getEnv("LOGLEVEL") as LogType) || options.logLevel || getEnv("VITEST")
        ? "debug"
        : "info";
    logger.level = LogLevels[logLevel];
    if (this.options.throwOnError === undefined && getEnv("VITEST") != null) {
      this.options.throwOnError = true;
    }
    this.addEventListener("*", logEvent);
    this.addEventListener("error", (error) => {
      logger.error(error.detail.message);
      this.errors.push(error);
    });
  }

  start() {
    this.renderInProgress = true;
    if (this.state !== "rendering") {
      this.setRendering();
    }
    render(this).finally(() => {
      this.renderInProgress = false;
      if (this.renderQueued) {
        this.renderQueued = false;
        this.start();
      }
    });
  }

  abort() {
    this.dispatchEvent(createLifecycleEvent("root", { state: "aborted" }));
    this.abortController.abort();
    // this.finish();
  }

  setSettled() {
    this.state = "settled";
    this.dispatchEvent(createLifecycleEvent("root", { state: "settled" }));
  }

  setRendering() {
    this.state = "rendering";
    this.dispatchEvent(createLifecycleEvent("root", { state: "rendering" }));
  }

  setListening() {
    this.state = "listening";
    this.dispatchEvent(createLifecycleEvent("root", { state: "listening" }));
  }

  get aborted() {
    return this.abortController.signal.aborted;
  }

  getAllMessages() {
    return resolveMessages(this.root);
  }

  queueRender(reason: string) {
    logger.debug(
      toLogFmt([
        ["call", "queueRender"],
        ["reason", reason],
      ]),
    );
    if (!this.renderInProgress) {
      this.start();
    } else {
      this.renderQueued = true;
    }
  }

  /**
   * Inputs
   */

  setInputNode(node: PerformerNode) {
    logger.debug(
      toLogFmt([
        ["input", "pending"],
        ["node", nodeToStr(node)],
      ]),
    );
    // if input already queue then deliver to node immediately
    const inputNode = node;
    if (!inputNode.hooks.input) {
      throw Error("Unable to set input node. Node does not have input hook.");
    }
    if (inputNode.hooks.input.state !== "pending") {
      throw Error("Unable to set input node. Input hook state not pending.");
    }
    if (this.inputQueue.length) {
      inputNode.hooks.input = {
        state: "fulfilled",
        value: [...this.inputQueue],
      };
      inputNode.status = "PENDING";
      this.inputQueue = [];
      this.queueRender("input fulfilled");
    } else {
      this.inputNode = inputNode;
      this.setListening();
    }
  }

  input(message: PerformerMessage) {
    if (this.inputNode) {
      this.inputNode.hooks.input = {
        state: "fulfilled",
        value: [message],
      };
      this.inputNode.status = "PENDING";
      this.inputNode = undefined;
      this.queueRender("input fulfilled");
    } else {
      this.inputQueue.push(message);
    }
  }

  async waitUntilSettled() {
    if (this.state === "settled") {
      return;
    }
    return new Promise<void>((resolve) => {
      this.addEventListener("lifecycle", (event) => {
        if (event.detail.state === "settled") {
          resolve();
        }
      });
    });
  }

  async waitUntilListening() {
    if (this.state === "listening") {
      return;
    }
    return new Promise<void>((resolve) => {
      this.addEventListener("lifecycle", (event) => {
        if (event.detail.state === "listening") {
          resolve();
        }
      });
    });
  }

  onError(threadId: string, error: unknown) {
    this.dispatchEvent(createErrorEvent(threadId, { error }));
    this.setSettled();
    if (this.options.throwOnError) {
      throw error;
    }
    return Promise.resolve();
  }

  /* Events */

  addEventListener<Type extends keyof PerformerEventMap>(
    type: Type,
    listener: (data: PerformerEventMap[Type]) => void,
  ) {
    if (type === "*") {
      this.emitter.onAny((_, data) =>
        listener(data as PerformerEventMap[Type]),
      );
    } else {
      this.emitter.on(type, listener);
    }
  }

  dispatchEvent(event: PerformerEventMap[keyof PerformerEventMap]) {
    this.emitter.emit(event.type as keyof PerformerEventMap, event);
  }
}
