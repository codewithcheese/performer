import type { PerformerElement } from "./element.js";
import type { PerformerNode } from "./node.js";
import { render, resolveMessages } from "./render.js";
import {
  PerformerErrorEvent,
  PerformerEventMap,
  PerformerLifecycleEvent,
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

export class Performer {
  #uid: string;

  app: PerformerElement;
  root?: PerformerNode;
  options: PerformerOptions;
  errors: PerformerErrorEvent[] = [];

  hasFinished: boolean = false;

  // todo add deadline
  inputQueue: PerformerMessage[] = [];
  inputNode: PerformerNode | undefined;

  abortController = new AbortController();

  renderQueued = false;
  renderPromised: ReturnType<typeof render> | null = null;

  threadNonce = 0;

  emitter = new Emittery<PerformerEventMap>();

  constructor(app: PerformerElement, options: PerformerOptions = {}) {
    this.#uid = crypto.randomUUID();
    this.app = app;
    this.options = options;
    const logLevel: LogType =
      (getEnv("LOGLEVEL") as LogType) || options.logLevel || "info";
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
    this.renderPromised = render(this);
  }

  abort() {
    this.dispatchEvent(
      new PerformerLifecycleEvent("root", { state: "aborted" }),
    );
    this.abortController.abort();
    // this.finish();
  }

  finish() {
    this.hasFinished = true;
    this.dispatchEvent(
      new PerformerLifecycleEvent("root", { state: "finished" }),
    );
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
    if (this.renderQueued) {
      return;
    }
    if (this.renderPromised) {
      this.renderQueued = true;
      this.renderPromised.finally(() => {
        this.renderQueued = false;
        this.renderPromised = render(this);
      });
    } else {
      this.renderQueued = true;
      Promise.resolve().then(() => {
        this.renderQueued = false;
        this.renderPromised = render(this);
      });
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
      this.queueRender("input fulfilled");
    } else {
      this.inputNode = inputNode;
      this.dispatchEvent(
        new PerformerLifecycleEvent(node.threadId, { state: "listening" }),
      );
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
    if (this.hasFinished) {
      return;
    }
    if (this.inputNode) {
      return;
    }
    return new Promise<void>((resolve) => {
      this.addEventListener("lifecycle", (event) => {
        if (
          event.detail.state === "listening" ||
          event.detail.state === "finished"
        ) {
          resolve();
        }
      });
    });
  }

  onError(threadId: string, error: unknown) {
    this.dispatchEvent(new PerformerErrorEvent(threadId, error));
    this.finish();
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
