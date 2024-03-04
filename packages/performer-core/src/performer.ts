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
import { logEvent, nodeToStr, toLogFmt } from "./util/log.js";
import { TypedEventTarget } from "./util/typed-event-target.js";

type PerformerOptions = {
  throwOnError?: boolean;
  logLevel?: "trace" | "debug" | "info" | "warn" | "error";
};

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

  threadNonce = 0;

  constructor(app: PerformerElement, options: PerformerOptions = {}) {
    super();
    this.#uid = crypto.randomUUID();
    this.app = app;
    this.options = options;
    log.setLevel(options.logLevel || "debug");
    if (
      this.options.throwOnError === undefined &&
      globalThis.process &&
      process.env["VITEST"] != null
    ) {
      this.options.throwOnError = true;
    }
    this.addEventListener("delta", (delta) => {
      logEvent(delta);
    });
    this.addEventListener("error", (error) => {
      log.error(error.detail.message);
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
    this.controller.abort();
    this.finish();
  }

  finish() {
    this.hasFinished = true;
    this.dispatchEvent(
      new PerformerLifecycleEvent("root", { state: "finished" }),
    );
  }

  get aborted() {
    return this.controller.signal.aborted;
  }

  getAllMessages() {
    return resolveMessages(this.root);
  }

  queueRender(reason: string) {
    log.debug(
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
    log.debug(
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
    this.finish();
    if (this.options.throwOnError) {
      throw error;
    } else {
      this.dispatchEvent(new PerformerErrorEvent(threadId, error));
    }
  }
}
