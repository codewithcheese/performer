/**
 * Session responsible for starting/resuming apps.
 *
 * Apps are defined as a tree of elements.
 */
import type { PerformerElement } from "./element.js";
import type { PerformerNode } from "./node.js";
import { render } from "./render.js";
import {
  PerformerErrorEvent,
  PerformerLifecycleEvent,
  PerformerMessageEvent,
  PerformerEventMap,
} from "./event.js";
import type { PerformerMessage } from "./message.js";
import log from "loglevel";
import { LogConfig, logNode } from "./util/log.js";
import { PendingInputState } from "./hooks/index.js";
import { TypedEventTarget } from "./util/typed-event-target.js";

type RunProps = {
  id?: string;
  element: PerformerElement;
  node?: PerformerNode;
  throwOnError?: boolean;
};

export type PendingInputNode = PerformerNode & {
  hooks: { input: PendingInputState };
};

export class Performer extends TypedEventTarget<PerformerEventMap> {
  #uid: string;

  element: PerformerElement;
  node?: PerformerNode;
  errors: PerformerErrorEvent[] = [];

  hasFinished: boolean = false;

  // todo add deadline
  inputQueue: PerformerMessage[] = [];
  inputNode: PendingInputNode | undefined;

  abortController = new AbortController();

  throwOnError = false;

  renderQueued = false;
  renderPromised: ReturnType<typeof render> | null = null;

  logConfig: LogConfig = {
    showDeltaEvents: true,
    showResolveMessages: false,
  };

  constructor({ element, throwOnError }: RunProps) {
    super();
    this.#uid = crypto.randomUUID();
    this.element = element;
    this.throwOnError =
      throwOnError === undefined
        ? globalThis.process && process.env["VITEST"] != null
        : throwOnError;
    this.addEventListener("error", (error) => {
      this.errors.push(error);
    });
  }

  start() {
    this.renderPromised = render(this);
  }

  abort() {
    // todo test action abort
    this.dispatchEvent(new PerformerLifecycleEvent({ state: "aborted" }));
    this.abortController.abort();
    this.finish();
  }

  finish() {
    this.hasFinished = true;
    this.dispatchEvent(new PerformerLifecycleEvent({ state: "finished" }));
  }

  get aborted() {
    return this.abortController.signal.aborted;
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
      throw Error("Cannot set input not without input hook");
    }
    if (inputNode.hooks.input.state !== "pending") {
      throw Error("Cannot set input, input state not pending");
    }
    if (this.inputQueue.length) {
      inputNode.hooks.input.resolve([...this.inputQueue]);
    } else {
      this.inputNode = inputNode as PendingInputNode;
      this.dispatchEvent(new PerformerLifecycleEvent({ state: "listening" }));
    }
  }

  input(event: PerformerMessageEvent) {
    if (this.inputNode) {
      this.inputNode.hooks.input.resolve([event.detail.message]);
      this.inputNode = undefined;
    } else {
      this.inputQueue.push(event.detail.message);
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
}
