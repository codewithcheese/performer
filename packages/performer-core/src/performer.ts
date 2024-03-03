import type { PerformerElement } from "./element.js";
import type { PerformerNode } from "./node.js";
import { render, resolveMessages } from "./render.js";
import {
  PerformerErrorEvent,
  PerformerEventMap,
  PerformerLifecycleEvent,
} from "./event.js";
import type { PerformerMessage } from "./message.js";
import * as log from "loglevel";
import { LogConfig, logEvent, logNode } from "./util/log.js";
import { TypedEventTarget } from "./util/typed-event-target.js";
import { ThreadState } from "./hooks/index.js";

type PerformerOptions = { throwOnError?: boolean };

export class Performer extends TypedEventTarget<PerformerEventMap> {
  #uid: string;

  app: PerformerElement;
  root?: PerformerNode;
  options: PerformerOptions;
  errors: PerformerErrorEvent[] = [];

  hasFinished: boolean = false;

  // todo add deadline
  inputQueue: PerformerMessage[] = [];
  inputNode: PerformerNode | undefined;

  controller = new AbortController();

  renderQueued = false;
  renderPromised: ReturnType<typeof render> | null = null;

  logConfig: LogConfig = {
    showDeltaEvents: true,
    showResolveMessages: false,
  };

  threadNonce = 0;

  constructor(app: PerformerElement, options: PerformerOptions = {}) {
    super();
    this.#uid = crypto.randomUUID();
    this.app = app;
    this.options = options;
    if (
      this.options.throwOnError === undefined &&
      globalThis.process &&
      process.env["VITEST"] != null
    ) {
      this.options.throwOnError = true;
    }
    this.addEventListener("delta", (delta) => {
      logEvent(delta, this.logConfig);
    });
    this.addEventListener("error", (error) => {
      this.errors.push(error);
    });
  }

  start() {
    this.renderPromised = render(this);
  }

  abort() {
    this.dispatchEvent(new PerformerLifecycleEvent({ state: "aborted" }));
    this.controller.abort();
    this.finish();
  }

  finish() {
    this.hasFinished = true;
    this.dispatchEvent(new PerformerLifecycleEvent({ state: "finished" }));
  }

  get aborted() {
    return this.controller.signal.aborted;
  }

  getAllMessages() {
    return resolveMessages(this.root);
  }

  queueRender() {
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
    log.debug("Input node", logNode(node));
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
      this.queueRender();
    } else {
      this.inputNode = inputNode;
      this.dispatchEvent(new PerformerLifecycleEvent({ state: "listening" }));
    }
  }

  input(message: PerformerMessage) {
    if (this.inputNode) {
      this.inputNode.hooks.input = {
        state: "fulfilled",
        value: [message],
      };
      this.inputNode = undefined;
      this.queueRender();
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

  onError(error: unknown) {
    this.finish();
    if (this.options.throwOnError) {
      throw error;
    } else {
      this.dispatchEvent(new PerformerErrorEvent(error));
    }
  }
}
