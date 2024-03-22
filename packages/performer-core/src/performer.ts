import type { PerformerElement } from "./element.js";
import type { PerformerNode, SerializedNode } from "./node.js";
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
import { hydrate, serialize } from "./hydration.js";

export type PerformerOptions = {
  throwOnError?: boolean;
  logLevel?: LogType;
};

type PerformerState = "pending" | "running" | "settled";

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
    this.dispatchEvent(createLifecycleEvent("root", { state: "aborted" }));
    // abort should result in settled state
    this.abortController.abort();
  }

  setState(state: PerformerState) {
    if (state === "settled") {
      // todo update lifecycle event to be consistent for all states
      this.dispatchEvent(createLifecycleEvent("root", { state: "settled" }));
    }
    this.state = state;
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
      this.state = "settled";
      this.dispatchEvent(
        createLifecycleEvent(node.threadId, { state: "listening" }),
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
    // if (this.hasFinished) {
    //   return;
    // }
    // if (this.inputNode) {
    //   return;
    // }
    if (this.state === "settled") {
      return true;
    }
    return new Promise<void>((resolve) => {
      this.addEventListener("lifecycle", (event) => {
        if (
          event.detail.state === "listening" ||
          event.detail.state === "settled"
        ) {
          resolve();
        }
      });
    });
  }

  onError(threadId: string, error: unknown) {
    this.dispatchEvent(createErrorEvent(threadId, { error }));
    this.setState("settled");
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

  /* Hydration */

  async hydrate(
    serialized: SerializedNode,
    elementMap: Record<string, PerformerElement> = {},
  ) {
    await hydrate({
      performer: this,
      element: this.app,
      serialized: serialized,
      elementMap,
    });
  }

  serialize() {
    if (!this.root) {
      throw Error("Cannot serialize before Performer started.");
    }
    return serialize(this.root);
  }
}
