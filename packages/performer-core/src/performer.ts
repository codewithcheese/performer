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

type RunProps = {
  id?: string;
  element: PerformerElement;
  node?: PerformerNode;
  throwOnError?: boolean;
};

type EventHandler = (event: PerformerEvent) => void;

export class Performer {
  id: string;
  element: PerformerElement;
  node?: PerformerNode;
  errors: Error[] = [];
  inputQueue: PerformerMessage[] = [];
  inputNode: PerformerNode | undefined;
  private eventHandler: EventHandler | undefined;
  hasFinished: boolean = false;
  finish: () => void = () => {};
  // todo add deadline
  waitUntilFinished: Promise<void>;
  inputResolver: () => void = () => {};
  waitForInput: Promise<void>;

  abortController = new AbortController();

  nodes: Map<PerformerElement, PerformerNode> = new Map();
  depsInUse: Set<string> = new Set<string>();
  config: Record<string, any> = {};
  throwOnError = false;

  renderQueued = false;
  rendering: ReturnType<typeof render> | null = null;

  logConfig: LogConfig = {
    showUpdateEvents: true,
    showResolveMessages: false,
  };

  constructor({ id, element, node, throwOnError }: RunProps) {
    this.id = id || crypto.randomUUID();
    this.element = element;
    this.node = node;
    this.waitUntilFinished = new Promise<void>(
      (resolve) =>
        (this.finish = () => {
          log.debug(`Session finished ${this.id}`);
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
    this.waitForInput = new Promise<void>(
      (resolve) => (this.inputResolver = resolve),
    )
      .catch(console.error)
      .finally(() => console.log("wait for input complete"));
    this.throwOnError =
      throwOnError === undefined
        ? process.env["VITEST"] !== undefined
        : throwOnError;
  }

  start() {
    this.rendering = render(this);
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
    if (this.rendering) {
      this.renderQueued = true;
      this.rendering.finally(() => {
        this.renderQueued = false;
        this.rendering = render(this);
      });
    } else {
      this.renderQueued = true;
      Promise.resolve().then(() => {
        this.renderQueued = false;
        this.rendering = render(this);
      });
    }
  }

  /**
   * Inputs
   */

  setInputNode(node: PerformerNode) {
    log.debug("Input node", logNode(node));
    // if input already queue then deliver to node immediately
    if (this.inputQueue.length) {
      node.hooks.input!.resolve([...this.inputQueue]);
    } else {
      this.inputNode = node;
      this.inputResolver();
    }
  }

  input(event: PerformerEvent) {
    if (event.type === "MESSAGE") {
      if (this.inputNode) {
        this.inputNode.hooks.input!.resolve([event.payload]);
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
    return Promise.race([this.waitForInput, this.waitUntilFinished]).finally(
      () => {
        this.waitForInput = new Promise<void>(
          (resolve) => (this.inputResolver = resolve),
        ).catch(console.error);
      },
    );
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
