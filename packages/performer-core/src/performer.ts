import type { PerformerElement } from "./element.js";
import { PerformerNode } from "./node.js";
import { freeElement, render, resolveMessages } from "./render.js";
import {
  createErrorEvent,
  createLifecycleEvent,
  PerformerErrorEvent,
  PerformerEventMap,
} from "./event.js";
import type { PerformerMessage } from "./message.js";
import {
  getLogger,
  logEvent,
  logger,
  nodeToStr,
  setLogLevel,
  toLogFmt,
} from "./util/log.js";
import { getEnv } from "./util/env.js";
import { LogLevels, type LogType } from "consola";
import Emittery from "emittery";
import { ActionType } from "./action.js";
import { assertTrue, assertTruthy } from "./util/assert.js";

export type PerformerOptions = {
  throwOnError?: boolean;
  logLevel?: LogType;
};

export type PerformerState = "pending" | "listening" | "rendering" | "finished";

export class Performer {
  #uid: string;

  app: PerformerElement;
  root?: PerformerNode;
  options: PerformerOptions;
  errors: PerformerErrorEvent[] = [];
  state: PerformerState = "pending";

  elementMap: Map<string, PerformerElement> = new Map();

  // todo add deadline
  inputQueue: PerformerMessage[] = [];
  inputNode: PerformerNode | undefined;

  abortController = new AbortController();

  renderQueued = false;
  renderQueuedReason: string = "";
  renderInProgress: boolean = false;

  threadNonce = 0;

  emitter = new Emittery<PerformerEventMap>();

  constructor(options: PerformerOptions = {}) {
    this.#uid = crypto.randomUUID();
    // this.app = app;
    this.options = options;
    const logLevel: LogType =
      (getEnv("LOGLEVEL") as LogType) ||
      options.logLevel ||
      (getEnv("VITEST") && "info") ||
      "info";
    const logger = getLogger("Performer");
    setLogLevel(logLevel);
    if (this.options.throwOnError === undefined && getEnv("VITEST") != null) {
      this.options.throwOnError = true;
    }
    // this.addEventListener("*", logEvent);
    this.addEventListener("error", (error) => {
      logger.error(error.detail.message);
      this.errors.push(error);
    });
    // insert a noop root
    this.app = {
      id: "root",
      type: () => {},
      props: {},
      onFinalize: () => this.finalize("root"),
      onStreaming: () => {},
    };
    this.elementMap.set("root", this.app);
  }

  start(reason: string) {
    this.renderInProgress = true;
    if (this.state !== "rendering") {
      this.setRendering();
    }
    render(this, reason).finally(() => {
      this.renderInProgress = false;
      if (this.renderQueued) {
        this.renderQueued = false;
        this.start(this.renderQueuedReason);
      }
    });
  }

  insert({
    id,
    type,
    props = {},
    previous,
    onFinalize,
    onStreaming,
  }: {
    id: string;
    type: PerformerElement["type"];
    props?: Record<string, any>;
    previous: { id: string; type: "parent" | "sibling" } | null;
    onFinalize: () => void;
    onStreaming: () => void;
  }) {
    const logger = getLogger("Performer:insert");
    const element: PerformerElement = {
      id,
      type,
      props,
      onFinalize,
      onStreaming,
    };

    if (!previous) {
      // no previous assign as first child of root
      const parent = this.app;
      element.parent = this.app;
      parent.child = element;
      logger.info(`Insert child ${id} on root.`);
    } else if (previous.type === "parent") {
      const parent = this.elementMap.get(previous.id);
      if (!parent) {
        throw Error(
          `Failed to insert Performer element ${id}. Parent not registered`,
        );
      }
      element.parent = parent;
      parent.child = element;
      logger.info(`Insert child ${id} on ${parent.id}`);
    } else {
      const sibling = this.elementMap.get(previous.id);
      if (!sibling) {
        throw Error(
          `Failed to insert Performer element ${id}. Sibling not registered`,
        );
      }
      sibling.sibling = element;
      element.parent = sibling.parent;
      logger.info(`Insert sibling ${id} on ${sibling.id}`);
    }
    // register
    this.elementMap.set(id, element);
    // set render before next render since we know state has changed
    this.setRendering();
    this.queueRender("remove element");
    return element;
  }

  remove(id: string) {
    const logger = getLogger("Performer:remove");
    logger.debug(`id=${id}`);
    freeElement(this.elementMap.get(id)!);
    this.elementMap.delete(id);
    this.setRendering();
    this.queueRender("new element");
  }

  finalize(id: string) {
    const element = this.elementMap.get(id);
    assertTruthy(element, "Expect element when finalizing");
    assertTruthy(element.node, "Expect element.node when finalizing");
    element.node.status = "RESOLVED";
    this.queueRender(`${id} finalized`);
  }

  getElement(id: string) {
    let cursor: PerformerElement | undefined = this.app;
    while (cursor) {
      if (cursor.id === id) {
        return cursor;
      }
      if (cursor.child) {
        cursor = cursor.child;
        continue;
      }
      while (cursor) {
        if (cursor.sibling) {
          cursor = cursor.sibling;
          break;
        }
        cursor = cursor.parent;
      }
    }
    return null;
  }

  abort() {
    this.dispatchEvent(createLifecycleEvent("root", { state: "aborted" }));
    this.abortController.abort();
    // this.finish();
  }

  setFinished() {
    this.state = "finished";
    logger.debug(`state=${this.state}`);
    this.dispatchEvent(createLifecycleEvent("root", { state: "finished" }));
  }

  setRendering() {
    this.state = "rendering";
    logger.debug(`state=${this.state}`);
    this.dispatchEvent(createLifecycleEvent("root", { state: "rendering" }));
  }

  setListening() {
    this.state = "listening";
    logger.debug(`state=${this.state}`);
    this.dispatchEvent(createLifecycleEvent("root", { state: "listening" }));
  }

  get aborted() {
    return this.abortController.signal.aborted;
  }

  getAllMessages() {
    return resolveMessages(this.root);
  }

  queueRender(reason: string) {
    getLogger("Performer:queueRender").debug(
      toLogFmt([
        ["call", "queueRender"],
        ["reason", reason],
      ]),
    );
    if (!this.renderInProgress) {
      this.renderInProgress = true;
      requestIdleCallback(() => this.start(reason));
    } else {
      this.renderQueued = true;
      this.renderQueuedReason = reason;
    }
  }

  /**
   * Inputs
   */

  // todo how to set input?
  // setInputNode(node: PerformerNode) {
  //   logger.debug(
  //     toLogFmt([
  //       ["input", "pending"],
  //       ["node", nodeToStr(node)],
  //     ]),
  //   );
  //   // if input already queue then deliver to node immediately
  //   const inputNode = node;
  //   if (!inputNode.hooks.input) {
  //     throw Error("Unable to set input node. Node does not have input hook.");
  //   }
  //   if (inputNode.hooks.input.state !== "pending") {
  //     throw Error("Unable to set input node. Input hook state not pending.");
  //   }
  //   if (this.inputQueue.length) {
  //     inputNode.hooks.input = {
  //       state: "fulfilled",
  //       value: [...this.inputQueue],
  //     };
  //     inputNode.status = "PENDING";
  //     this.inputQueue = [];
  //     this.queueRender("input fulfilled");
  //   } else {
  //     this.inputNode = inputNode;
  //   }
  // }

  submit(message: PerformerMessage) {
    this.inputQueue.push(message);
    this.queueRender("input fulfilled");
  }

  async waitUntilFinished(signal?: AbortSignal) {
    if (this.state === "finished") {
      return;
    }
    return new Promise<void>((resolve) => {
      this.addEventListener("lifecycle", (event) => {
        if (event.detail.state === "finished") {
          resolve();
        }
      });
      if (signal) {
        signal.addEventListener("abort", () => resolve());
      }
    });
  }

  async waitUntilListening(signal?: AbortSignal) {
    if (this.state === "listening") {
      return;
    }
    return new Promise<void>((resolve) => {
      this.addEventListener("lifecycle", (event) => {
        if (event.detail.state === "listening") {
          resolve();
        }
        if (signal) {
          signal.addEventListener("abort", () => resolve());
        }
      });
    });
  }

  /**
   * Wait for listening or finished state.
   *
   * Useful for tests when the final state is not controllable due to flakey model
   */
  async waitUntilSettled() {
    const controller = new AbortController();
    return Promise.race([
      this.waitUntilListening(controller.signal),
      this.waitUntilFinished(controller.signal),
    ]).then(() => controller.abort());
  }

  onError(threadId: string, error: unknown) {
    this.dispatchEvent(createErrorEvent(threadId, { error }));
    this.setFinished();
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
