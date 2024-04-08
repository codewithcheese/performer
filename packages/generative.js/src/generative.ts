import type { GenerativeElement } from "./element.js";
import { GenerativeNode, setNodeFinalized } from "./node.js";
import { freeElement, render, resolveMessages } from "./render.js";
import type { GenerativeMessage } from "./message.js";
import { getLogger, logger, setLogLevel } from "./util/log.js";
import { getEnv } from "./util/env.js";
import { type LogType } from "consola";
import { assertExists } from "./util/assert.js";
import { withResolvers } from "./util/with-resolvers.js";

export type GenerativeOptions = {
  throwOnError?: boolean;
  logLevel?: LogType;
};

export type GenerativeHandlers = {
  onFinished?: (messages: GenerativeMessage[]) => void;
};

export type GenerativeState =
  | "pending"
  | "listening"
  | "rendering"
  | "finished";

export class Generative {
  #uid: string;

  app: GenerativeElement;
  root?: GenerativeNode;

  options: GenerativeOptions;
  handlers: GenerativeHandlers;

  #state: GenerativeState = "pending";
  #statePromises: Map<GenerativeState, () => void> = new Map();

  elementMap: Map<string, GenerativeElement> = new Map();

  // todo add deadline
  inputQueue: GenerativeMessage[] = [];

  abortController = new AbortController();

  renderQueued = false;
  renderQueuedReason: string = "";
  renderInProgress: boolean = false;

  constructor(
    options: GenerativeOptions = {},
    handlers: GenerativeHandlers = {},
  ) {
    this.#uid = crypto.randomUUID();
    // options
    this.options = options;
    const logLevel: LogType =
      (getEnv("LOGLEVEL") as LogType) ||
      options.logLevel ||
      (getEnv("VITEST") && "info") ||
      "info";
    setLogLevel(logLevel);
    if (this.options.throwOnError === undefined && getEnv("VITEST") != null) {
      this.options.throwOnError = true;
    }
    // handlers
    this.handlers = handlers;
    // insert a noop root
    this.app = {
      id: "root",
      type: "NOOP",
      typeName: "root",
      props: {},
      // finalize manually since has no hook
      onResolved: () => this.finalize("root"),
      onStreaming: () => {},
      onError: () => {},
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

  upsert({
    id,
    type,
    typeName,
    props = {},
    ancestor,
    onResolved,
    onStreaming,
    onError,
  }: {
    id: string;
    type: GenerativeElement["type"];
    typeName: string;
    props?: Record<string, any>;
    ancestor: { id: string; type: "parent" | "sibling" };
    onResolved: (node: GenerativeNode) => void;
    onStreaming: (node: GenerativeNode) => void;
    onError: (error: unknown) => void;
  }) {
    const logger = getLogger("Generative:upsert");
    let element = this.elementMap.get(id);
    if (!element) {
      // insert element
      logger.debug(`insert=${id}`);
      element = {
        id,
        type,
        typeName,
        props,
        onResolved,
        onStreaming,
        onError,
      };
    } else {
      logger.debug(`update=${id}`);
      element = {
        ...element,
        type,
        typeName,
        props,
        onResolved,
        onStreaming,
        onError,
      };
    }

    this.elementMap.set(id, element);
    this.updateAncestor(id, typeName, ancestor);

    return element;
  }

  updateAncestor(
    id: string,
    typeName: string,
    newAncestor: { id: string; type: "parent" | "sibling" },
    oldAncestor?: { id: string; type: "parent" | "sibling" },
  ) {
    const logger = getLogger("Generative:updateAncestor");
    const element = this.elementMap.get(id)!;
    // unlink old ancestor
    if (oldAncestor) {
      const ancestor = this.elementMap.get(oldAncestor.id)!;
      // unlink old ancestor if still exists and it still points at element
      if (
        ancestor &&
        oldAncestor.type === "parent" &&
        ancestor.child === element
      ) {
        ancestor.child = undefined;
      } else if (
        ancestor &&
        oldAncestor.type === "sibling" &&
        ancestor.sibling === element
      ) {
        ancestor.sibling = undefined;
      }
    }
    // link new ancestor
    if (newAncestor.type === "parent") {
      const parent = this.elementMap.get(newAncestor.id);
      if (!parent) {
        throw Error(
          `Failed to insert generative element ${typeName} ${id}. Parent not registered`,
        );
      }
      element.parent = parent;
      parent.child = element;
      logger.info(`Insert child ${id} on ${parent.id}`);
    } else {
      const sibling = this.elementMap.get(newAncestor.id);
      if (!sibling) {
        throw Error(
          `Failed to insert generative element ${typeName} ${id}. Sibling not registered`,
        );
      }
      sibling.sibling = element;
      element.parent = sibling.parent;
      logger.info(`Insert sibling ${id} on ${sibling.id}`);
    }
    // fixme: state changes should be handled by rendering logic
    this.setRendering();
    this.queueRender("update ancestor");
  }

  remove(id: string) {
    const logger = getLogger("Generative:remove");
    logger.debug(`id=${id}`);
    freeElement(this.elementMap.get(id)!);
    this.elementMap.delete(id);
    // fixme: state changes should be handled by rendering logic
    this.setRendering();
    this.queueRender("remove element");
  }

  finalize(id: string) {
    const element = this.elementMap.get(id);
    assertExists(element, "Expect element when finalizing");
    assertExists(element.node, "Expect element.node when finalizing");
    setNodeFinalized(element.node);
    this.queueRender(`${id} finalized`);
  }

  getElement(id: string) {
    let cursor: GenerativeElement | undefined = this.app;
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
    // todo: test abort when running message action
    this.abortController.abort();
    // this.finish();
  }

  setFinished() {
    this.state = "finished";
    this.handlers.onFinished && this.handlers.onFinished(this.getAllMessages());
  }

  setRendering() {
    this.state = "rendering";
  }

  setListening() {
    this.state = "listening";
  }

  get aborted() {
    return this.abortController.signal.aborted;
  }

  getAllMessages() {
    return resolveMessages(this.root);
  }

  queueRender(reason: string) {
    getLogger("Generative:queueRender").debug(`reason=${reason}`);
    if (!this.renderInProgress) {
      this.renderInProgress = true;
      requestIdleCallback(() => this.start(reason));
    } else {
      this.renderQueued = true;
      this.renderQueuedReason = reason;
    }
  }

  submit(message: GenerativeMessage) {
    this.inputQueue.push(message);
    this.queueRender("input fulfilled");
  }

  get state() {
    return this.#state;
  }

  set state(value: GenerativeState) {
    this.#state = value;
    logger.withTag("Generative").debug(`state=${this.state}`);
    this.resolveStatePromise(value);
  }

  private resolveStatePromise(state: GenerativeState) {
    const resolve = this.#statePromises.get(state);
    if (resolve) {
      resolve();
      this.#statePromises.delete(state);
    }
  }

  async waitForState(state: GenerativeState, signal?: AbortSignal) {
    if (this.state === state) {
      return;
    }

    if (signal && signal.aborted) {
      return;
    }

    const { promise, resolve } = withResolvers<void>();
    this.#statePromises.set(state, resolve);

    if (signal) {
      signal.addEventListener("abort", () => {
        this.#statePromises.delete(state);
        resolve();
      });
    }

    await promise;
  }

  async waitUntilFinished(signal?: AbortSignal) {
    await this.waitForState("finished", signal);
  }

  async waitUntilListening(signal?: AbortSignal) {
    await this.waitForState("listening", signal);
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
    this.setFinished();
    if (this.options.throwOnError) {
      throw error;
    }
  }
}
