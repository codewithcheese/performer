/**
 * Session responsible for starting/resuming apps.
 *
 * Apps are defined as a tree of elements.
 */
import type { PerformerElement } from "./element.js";
import type { PerformerNode } from "./node.js";
import { render } from "./render.js";
import type { PerformerEvent } from "./event.js";
import type { PerformerMessage } from "./message.js";
import log from "loglevel";
import { LogConfig, logEvent, logNode } from "./util/log.js";
import { PendingInputState } from "./hooks/index.js";

type RunProps = {
  id?: string;
  element: PerformerElement;
  node?: PerformerNode;
  throwOnError?: boolean;
};

export type PendingInputNode = PerformerNode & {
  hooks: { input: PendingInputState };
};

type EventHandler = (event: PerformerEvent) => void;

export class Performer {
  element: PerformerElement;
  node?: PerformerNode;
  errors: Error[] = [];

  private eventHandler: EventHandler | undefined;

  finish: () => void = () => {};
  hasFinished: boolean = false;
  waitUntilFinished: Promise<void>;

  // todo add deadline
  inputQueue: PerformerMessage[] = [];
  inputNode: PendingInputNode | undefined;
  listen: () => void = () => {};
  waitUntilListening: Promise<void>;

  abortController = new AbortController();

  throwOnError = false;

  renderQueued = false;
  renderPromised: ReturnType<typeof render> | null = null;

  logConfig: LogConfig = {
    showUpdateEvents: true,
    showResolveMessages: false,
  };

  constructor({ element, throwOnError }: RunProps) {
    this.element = element;
    this.waitUntilFinished = new Promise<void>(
      (resolve) =>
        (this.finish = () => {
          log.debug(`Performer finished`);
          if (!this.hasFinished) {
            this.announce({
              sid: crypto.randomUUID(),
              op: "once",
              type: "LIFECYCLE",
              payload: {
                state: "finished",
              },
            });
          }
          this.hasFinished = true;
          resolve();
        }),
    ).catch(console.error);
    this.waitUntilListening = new Promise<void>(
      (resolve) => (this.listen = resolve),
    )
      .catch(console.error)
      .finally(() => console.log("Listening..."));
    this.throwOnError =
      throwOnError === undefined
        ? globalThis.process && process.env["VITEST"] != null
        : throwOnError;
  }

  start() {
    this.renderPromised = render(this);
  }

  abort() {
    // todo test action abort
    this.announce({
      sid: crypto.randomUUID(),
      op: "once",
      type: "LIFECYCLE",
      payload: {
        state: "aborted",
      },
    });
    this.abortController.abort();
    this.finish();
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
      this.listen();
    }
  }

  input(event: PerformerEvent) {
    if (event.type === "MESSAGE") {
      if (this.inputNode) {
        this.inputNode.hooks.input.resolve([event.payload]);
        this.inputNode = undefined;
      } else {
        this.inputQueue.push(event.payload);
      }
    } else {
      throw Error(`Input of event type ${event.type} not supported.`);
    }
  }

  /**
   * Events
   */

  announce(event: PerformerEvent) {
    logEvent(event, this.logConfig);
    if (this.eventHandler) {
      this.eventHandler(event);
    }
  }

  addEventHandler(handler: EventHandler) {
    this.eventHandler = handler;
  }

  async waitUntilSettled() {
    return Promise.race([
      this.waitUntilListening,
      this.waitUntilFinished,
    ]).finally(() => {
      this.waitUntilListening = new Promise<void>(
        (resolve) => (this.listen = resolve),
      ).catch(console.error);
    });
  }

  /**
   * Errors
   */

  onError(error: unknown) {
    if (typeof error === "string") {
      error = new Error(error);
    }
    if (!(error instanceof Error)) {
      error = new Error("Unknown error");
    }
    if (error instanceof Error) {
      this.errors.push(error);
      this.announce({
        type: "ERROR",
        op: "once",
        sid: crypto.randomUUID(),
        payload: {
          message: error.message,
        },
      });
    }
  }
}
