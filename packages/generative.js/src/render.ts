import { type GenerativeElement } from "./element.js";
import {
  createNode,
  type GenerativeNode,
  setNodeError,
  setNodeListening,
  setNodeResolved,
  setNodeStreaming,
} from "./node.js";
import type { Generative } from "./generative.js";
import {
  AssistantMessage,
  concatDelta,
  isMessage,
  isMessageDelta,
  MessageDelta,
  GenerativeMessage,
} from "./message.js";
import { isEqualWith } from "lodash-es";
import { getLogger } from "./util/log.js";

type CreateOp = {
  type: "CREATE";
  payload: {
    // threadId: string;
    element: GenerativeElement;
    parent?: GenerativeNode;
    prevSibling?: GenerativeNode;
    nextSibling?: GenerativeNode;
    child?: GenerativeNode;
  };
};

type ResumeOp = {
  type: "RESUME";
  payload: {
    node: GenerativeNode;
  };
};

type PausedOp = {
  type: "PAUSED";
  payload: {
    node: GenerativeNode;
  };
};

// like paused by explicitly marked as requiring external input to continue
type ListeningOp = {
  type: "LISTENING";
  payload: {
    node: GenerativeNode;
  };
};

type AfterChildrenOp = {
  type: "AFTER_CHILDREN";
  payload: {
    node: GenerativeNode;
  };
};

export type RenderOp =
  | CreateOp
  | ResumeOp
  | PausedOp
  | AfterChildrenOp
  | ListeningOp;

function onlyListening(ops: Record<string, RenderOp>) {
  return Object.values(ops).every((op) => op.type === "LISTENING");
}

function noOps(ops: Record<string, RenderOp>) {
  return Object.keys(ops).length === 0;
}

let renderCount = 0;

export async function render(generative: Generative, reason: string) {
  if (!generative.app) {
    throw Error("Cannot render before app is assigned");
  }
  getLogger("render").debug(`start=${++renderCount} reason=${reason} `);
  try {
    const ops = evaluateRenderOps(
      // "root",
      generative.app!,
      generative.root,
      undefined,
      undefined,
    );
    for (const [_, op] of Object.entries(ops)) {
      switch (op.type) {
        case "CREATE":
          await performOp(generative, op);
          continue;
        case "RESUME":
          await performOp(generative, op);
          continue;
        case "LISTENING":
          if (generative.inputQueue.length) {
            op.payload.node.state.message = generative.inputQueue.shift();
            setNodeResolved(op.payload.node);
          }
          continue;
        case "AFTER_CHILDREN":
          op.payload.node.element.props.afterChildren!(
            generative.getAllMessages(),
          );
          setNodeResolved(op.payload.node);
          // ensure that render is queue at least once if afterChildren has no effect
          generative.queueRender("after children effect");
      }
    }
    if (noOps(ops) && !generative.renderQueued) {
      generative.setFinished();
    } else if (onlyListening(ops) && !generative.renderQueued) {
      generative.setListening();
    }
  } catch (error) {
    generative.onError("root", error);
  } finally {
    getLogger("render").debug(`end=${renderCount}`);
  }
}

/**
 *
 */
export function evaluateRenderOps(
  // threadId: string,
  element: GenerativeElement,
  node?: GenerativeNode,
  parent?: GenerativeNode,
  prevSibling?: GenerativeNode,
): Record<string, RenderOp> {
  // todo when does a node need to be re-created
  if (!node || !nodeMatchesElement(node, element)) {
    const op: CreateOp = {
      type: "CREATE",
      payload: {
        // threadId,
        element,
        parent: parent,
        prevSibling: prevSibling,
        nextSibling: node?.nextSibling,
        child: node?.child,
      },
    };
    if (node) {
      // do not free children, the new node will be linked in place and then children
      // re-evaluated on next renders
      freeNode(node, parent, false);
    }
    return { ["root"]: op };
  }

  if (node.status === "PENDING") {
    return {
      ["root"]: {
        type: "RESUME",
        payload: { node },
      } satisfies ResumeOp,
    };
  }

  if (node.status === "LISTENING") {
    return {
      ["root"]: { type: "LISTENING", payload: { node } } satisfies ListeningOp,
    };
  }

  if (node.status === "PAUSED") {
    return {
      ["root"]: { type: "PAUSED", payload: { node } } satisfies PausedOp,
    };
  }

  if (node.status === "RESOLVED") {
    return {
      ["root"]: { type: "PAUSED", payload: { node } } satisfies PausedOp,
    };
  }

  if (node.status === "ERROR") {
    return {};
  }

  let ops: Record<string, RenderOp> = {};
  let index = 0;
  // let childThreadId = node.hooks.thread?.id ? node.hooks.thread.id : threadId;
  let childNode: GenerativeNode | undefined = node.child;
  let childPrevSibling: GenerativeNode | undefined = undefined;
  let childElement: GenerativeElement | undefined = element.child;
  while (childElement || childNode) {
    if (!childElement) {
      break;
    }
    const childOps = evaluateRenderOps(
      // childThreadId,
      childElement,
      childNode,
      node,
      childPrevSibling,
    );
    Object.assign(ops, childOps);
    // increment childRenderCount if render op
    if (
      Object.values(childOps).find(
        (op) => op.type === "CREATE" || op.type === "RESUME",
      )
    ) {
      node.state.childRenderCount += 1;
    }
    // return if op for current thread otherwise continue
    // if (childThreadId in childOps) {
    if (Object.keys(childOps).length) {
      return ops;
    }
    if (childPrevSibling) {
      childPrevSibling.nextSibling = childNode;
    }
    childPrevSibling = childNode;
    childNode = childNode?.nextSibling;
    childElement = childElement?.sibling;

    index += 1;
  }

  // detach remaining node siblings and their children
  if (childNode) {
    freeNode(childNode, node, true);
  }

  // todo rethink afterChildren for Repeat
  if (node.state.childRenderCount > 0 && node.element.props.afterChildren) {
    ops["root"] = {
      type: "AFTER_CHILDREN",
      payload: { node },
    };
  }
  node.state.childRenderCount = 0;

  return ops;
}

export async function performOp(
  generative: Generative,
  op: CreateOp | ResumeOp,
): Promise<GenerativeNode> {
  let node;
  if (op.type === "CREATE") {
    const { element, parent, prevSibling, nextSibling, child } = op.payload;
    node = createNode({
      // threadId,
      element,
      parent,
      prevSibling,
      child,
    });
    if (!parent) {
      generative.root = node;
    }
    // link node in place
    if (prevSibling) {
      prevSibling.nextSibling = node;
    } else if (parent) {
      // if no prevSibling then must be first child
      parent.child = node;
    }
    if (nextSibling) {
      node.nextSibling = nextSibling;
      nextSibling.prevSibling = node;
    }
    if (child) {
      child.parent = node;
    }
    element.node = node;
  } else {
    node = op.payload.node;
  }
  await renderComponent(generative, node);
  // if (node.type instanceof Function) {
  //   await renderComponent(generative, node);
  // } else {
  //   await renderIntrinsic(generative, node);
  // }
  return node;
}

async function renderComponent(generative: Generative, node: GenerativeNode) {
  try {
    const type = node.element.type;
    if (type instanceof Function) {
      const messages = resolveMessages(generative.root, node);
      let result = await type({
        messages,
        signal: generative.abortController.signal,
      });
      if (result instanceof ReadableStream) {
        node.state.stream = result;
        node.status = "PAUSED";
        node.state.message = await consumeDeltaStream(
          generative,
          node,
          node.state.stream,
        );
        setNodeResolved(node);
        generative.queueRender("stream resolved");
      } else if (result && typeof result === "object") {
        if (Array.isArray(result)) {
          throw Error(
            `Invalid Message action return value. Expected object type GenerativeMessage. Received array: ${JSON.stringify(result)}`,
          );
        }
        if (!isMessage(result)) {
          throw Error(
            `Invalid Message action return value. Expected type GenerativeMessage. Received ${JSON.stringify(result)}.`,
          );
        }
        node.state.message = result;
        setNodeResolved(node);
      } else if (!result) {
        // return falsey no message will be applied
        setNodeResolved(node);
      } else {
        throw Error(
          `Invalid Message action return value. Received ${JSON.stringify(result)}.`,
        );
      }
    } else if (type === "LISTENER") {
      if (generative.inputQueue.length) {
        node.state.message = generative.inputQueue.shift();
        setNodeResolved(node);
      } else if (node.status !== "LISTENING") {
        setNodeListening(node);
        generative.setListening();
      }
    } else if (type === "NOOP") {
      setNodeResolved(node);
    } else if (isMessage(type)) {
      node.state.message = type;
      setNodeResolved(node);
    } else {
      throw Error(`Unexpected message type: ${JSON.stringify(type)}`);
    }
  } catch (e) {
    setNodeError(node, e);
  }

  // if (!Array.isArray(results)) {
  //   results = [results];
  // }
  // let previous: { id: string; type: "parent" | "sibling" } = {
  //   id: node.element.id,
  //   type: "parent",
  // };
  //
  // if (results !== null) {
  //   for (const result of results) {
  //     const id = nanoid();
  //     generative.insert({
  //       id,
  //       type: result.role,
  //       props: result,
  //       previous,
  //     });
  //     previous = { id, type: "sibling" };
  //   }
  // }
  // } finally {
  // clearRenderScope();
  // }
  // if (typeof view !== "function") {
  //   const returnType = view instanceof Promise ? "Promise" : typeof view;
  //   throw Error(
  //     `Component "${nodeToStr(node)}" returned invalid type: ${returnType}. Components must not be an async function, and must return a non-async function when using JSX.\n` +
  //       `To make async calls in your component use the \`useResource\` hook`,
  //   );
  // }

  // registerView(generative, node, view);
  // } catch (e) {
  //   if (e instanceof DeferResource) {
  //     node.status = "PAUSED";
  //     logPaused(node, "resource");
  //     e.cause.promise
  //       .then(() => {
  //         node.status = "PENDING";
  //         generative.queueRender("deferred resolved");
  //       })
  //       .catch((error) => generative.onError("root", error));
  //   } else if (e instanceof DeferInput) {
  //     node.status = "LISTENING";
  //     logPaused(node, "resource");
  //     generative.setInputNode(node);
  //     generative.queueRender("set input");
  //   } else {
  //     throw e;
  //   }
  // }
}

async function consumeDeltaStream(
  generative: Generative,
  node: GenerativeNode,
  stream: ReadableStream<MessageDelta>,
): Promise<GenerativeMessage> {
  // let chunks: MessageDelta[] = [];
  const message: AssistantMessage = { role: "assistant", content: null };
  for await (const chunk of stream) {
    if (!isMessageDelta(chunk)) {
      throw Error(
        `Chunk in stream does not match message delta. ${JSON.stringify(chunk)}`,
      );
    }
    concatDelta(message as MessageDelta, chunk);
    // rerender after each delta update
    node.state.message = message;
    setNodeStreaming(node);
  }
  return message;
}

export function freeElement(element: GenerativeElement) {
  getLogger("render:freeElement").debug(`id=${element.id}`);
  const parent = element.parent!;
  // find previous sibling
  let prevSibling;
  if (parent.child !== element) {
    prevSibling = parent.child;
    while (prevSibling && prevSibling.sibling !== element) {
      prevSibling = prevSibling.sibling;
    }
  }
  // assign sibling as new first child
  if (parent.child === element) {
    parent.child = element.sibling;
  }

  if (prevSibling) {
    prevSibling.sibling = element.sibling;
  }

  element.parent = undefined;
  element.sibling = undefined;
  element.child = undefined;
}

function freeNode(
  node: GenerativeNode,
  parent?: GenerativeNode,
  freeRemaining: boolean = false,
) {
  try {
    getLogger("render:freeNode").debug(`id=${node.element.id}`);
    // dispose view so that its no longer reactive
    // if (node.disposeView) {
    //   node.disposeView();
    // }
    if (!freeRemaining) {
      return;
    }
    if (freeRemaining && node.child) {
      freeNode(node.child, node, freeRemaining);
    }
    if (freeRemaining && node.nextSibling) {
      freeNode(node.nextSibling, node, freeRemaining);
    }
  } finally {
    // unlink node
    // when parent had 1 or more children but now has 0
    // all previous children will be freed, the parent.child should be unassigned
    if (parent?.child === node) {
      parent.child = undefined;
    }
    // if number of children reduced then this node might be an orphaned sibling
    // detach it from the remaining siblings
    if (node.prevSibling) {
      node.prevSibling.nextSibling = undefined;
    }
    node.parent = undefined;
    node.prevSibling = undefined;
    node.child = undefined;
    node.nextSibling = undefined;
    node.element.node = undefined;
  }
}

export function resolveMessages(
  from: GenerativeNode | undefined,
  to?: GenerativeNode,
): GenerativeMessage[] {
  let messages: GenerativeMessage[] = [];

  let cursor: GenerativeNode | undefined = from;
  while (cursor) {
    // too noisy for now
    // const pairs: [string, any][] = [
    //   ["resolve", "cursor"],
    //   ["threadId", cursor.threadId],
    //   ["node", nodeToStr(cursor)],
    // ];
    // if (typeof cursor.props.children === "string") {
    //   pairs.push(["content", cursor.props.children]);
    // }
    // log.debug(toLogFmt(pairs));

    // clear all messages if `to` belongs to cursor thread, and thread is isolated
    // if (
    //   to &&
    //   cursor.hooks.thread &&
    //   to.threadId === cursor.hooks.thread.id &&
    //   cursor.hooks.thread.isolated
    // ) {
    //   messages = [];
    // }

    // if (typeof cursor.type === "string") {
    //   messages.push(nodeToMessage(cursor));
    // }
    if (cursor.state.message && cursor.status === "FINALIZED") {
      messages.push(cursor.state.message);
    }

    const exit = to && cursor === to;
    if (exit) {
      break;
    }
    // thread props is a hierarchical id
    // parent threads are substring of the child thread
    // e.g. root/0 is parent of root/0/1, root/0 is not a parent of root/2/3
    // to.threadId.includes(cursor.child.threadId))
    // checks if child belongs to `to` thread or its parent
    if (
      cursor.child /* && (!to || to.threadId.includes(cursor.child.threadId))*/
    ) {
      cursor = cursor.child;
      continue;
    }

    while (cursor) {
      if (
        cursor.nextSibling // &&
        // (!to || to.threadId.includes(cursor.nextSibling.threadId))
      ) {
        cursor = cursor.nextSibling;
        break;
      }
      cursor = cursor.parent;
    }
  }

  return messages;
}

function nodeMatchesElement(node: GenerativeNode, element: GenerativeElement) {
  // todo create test cases for when nodes should be recreated
  // try dedupe anonymous function props
  // compare function props by string value
  const functionComparison = (
    value: unknown,
    other: unknown,
    indexOrKey: string | number | symbol | undefined,
    parent: any,
  ) => {
    if (
      typeof value === "function" &&
      typeof other === "function" &&
      !(indexOrKey === "type" && "props" in parent) && // exclude component type functions
      value !== other // if not already equal
    ) {
      return value.toString() === other.toString();
    }
    return undefined;
  };
  // React compat Fragment type is Symbol(react.fragment)
  return (
    (node.element.type === element.type ||
      typeof element.type === "symbol") /*&& node.type === Fragment*/ &&
    isEqualWith(node.element.props, element.props, functionComparison)
  );
}
