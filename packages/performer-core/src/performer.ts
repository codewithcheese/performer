import type { PerformerElement } from "./element.js";
import { PerformerNode, setNodeFinalized } from "./node.js";
import { freeElement, render, resolveMessages } from "./render.js";
import type { PerformerMessage } from "./message.js";
import { getLogger, logger, setLogLevel } from "./util/log.js";
import { getEnv } from "./util/env.js";
import { type LogType } from "consola";
import { assertExists } from "./util/assert.js";
import { withResolvers } from "./util/with-resolvers.js";

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
  #state: PerformerState = "pending";
  #statePromises: Map<PerformerState, () => void> = new Map();

  elementMap: Map<string, PerformerElement> = new Map();

  // todo add deadline
  inputQueue: PerformerMessage[] = [];

  abortController = new AbortController();

  renderQueued = false;
  renderQueuedReason: string = "";
  renderInProgress: boolean = false;

  constructor(options: PerformerOptions = {}) {
    this.#uid = crypto.randomUUID();
    // this.app = app;
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
    // insert a noop root
    this.app = {
      id: "root",
      type: () => {},
      typeName: "root",
      props: {},
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
    type: PerformerElement["type"];
    typeName: string;
    props?: Record<string, any>;
    ancestor: { id: string; type: "parent" | "sibling" };
    onResolved: (node: PerformerNode) => void;
    onStreaming: (node: PerformerNode) => void;
    onError: (error: unknown) => void;
  }) {
    const logger = getLogger("Performer:upsert");
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
    this.updateAncestor(id, ancestor);

    return element;
  }

  updateAncestor(
    id: string,
    newAncestor: { id: string; type: "parent" | "sibling" },
    oldAncestor?: { id: string; type: "parent" | "sibling" },
  ) {
    const logger = getLogger("Performer:updateAncestor");
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
          `Failed to insert Performer element ${id}. Parent not registered`,
        );
      }
      element.parent = parent;
      parent.child = element;
      logger.info(`Insert child ${id} on ${parent.id}`);
    } else {
      const sibling = this.elementMap.get(newAncestor.id);
      if (!sibling) {
        throw Error(
          `Failed to insert Performer element ${id}. Sibling not registered`,
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
    const logger = getLogger("Performer:remove");
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
    // todo: test abort when running message action
    this.abortController.abort();
    // this.finish();
  }

  setFinished() {
    this.state = "finished";
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
    getLogger("Performer:queueRender").debug(`reason=${reason}`);
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

  get state() {
    return this.#state;
  }

  set state(value: PerformerState) {
    this.#state = value;
    logger.withTag("Performer").debug(`state=${this.state}`);
    this.resolveStatePromise(value);
  }

  private resolveStatePromise(state: PerformerState) {
    const resolve = this.#statePromises.get(state);
    if (resolve) {
      resolve();
      this.#statePromises.delete(state);
    }
  }

  async waitForState(state: PerformerState, signal?: AbortSignal) {
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
    return Promise.resolve();
  }
}
