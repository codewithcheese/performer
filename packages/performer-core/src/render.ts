import { type PerformerElement } from "./element.js";
import {
  createNode,
  type PerformerNode,
  setNodeError,
  setNodeFinalize,
  setNodeStreaming,
} from "./node.js";
import type { Performer } from "./performer.js";
import {
  AssistantMessage,
  concatDelta,
  isMessage,
  isMessageDelta,
  MessageDelta,
  PerformerMessage,
} from "./message.js";
import { isEqualWith } from "lodash-es";
import { getLogger, logOp, toLogFmt } from "./util/log.js";

type CreateOp = {
  type: "CREATE";
  payload: {
    // threadId: string;
    element: PerformerElement;
    parent?: PerformerNode;
    prevSibling?: PerformerNode;
    nextSibling?: PerformerNode;
    child?: PerformerNode;
  };
};

type ResumeOp = {
  type: "RESUME";
  payload: {
    node: PerformerNode;
  };
};

type PausedOp = {
  type: "PAUSED";
  payload: {
    node: PerformerNode;
  };
};

// like paused by explicitly marked as requiring external input to continue
type ListeningOp = {
  type: "LISTENING";
  payload: {
    node: PerformerNode;
  };
};

type AfterChildrenOp = {
  type: "AFTER_CHILDREN";
  payload: {
    node: PerformerNode;
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

export async function render(performer: Performer, reason: string) {
  if (!performer.app) {
    throw Error("Cannot render before app is assigned");
  }
  getLogger("render").debug(`start count=${++renderCount} reason=${reason} `);
  try {
    const ops = evaluateRenderOps(
      // "root",
      performer.app!,
      performer.root,
      undefined,
      undefined,
    );
    for (const [threadId, op] of Object.entries(ops)) {
      logOp(threadId, op);
      switch (op.type) {
        case "CREATE":
          await performOp(performer, op);
          continue;
        case "RESUME":
          await performOp(performer, op);
          continue;
        case "LISTENING":
          if (performer.inputQueue.length) {
            op.payload.node.state.message = performer.inputQueue.shift();
            setNodeFinalize(op.payload.node);
          }
          continue;
        case "AFTER_CHILDREN":
          op.payload.node.element.props.afterChildren!();
          setNodeFinalize(op.payload.node);
          // ensure that render is queue at least once if afterChildren has no effect
          performer.queueRender("after children effect");
      }
    }
    if (noOps(ops) && !performer.renderQueued) {
      performer.setFinished();
    } else if (onlyListening(ops) && !performer.renderQueued) {
      performer.setListening();
    }
  } catch (error) {
    performer.onError("root", error);
  } finally {
    getLogger("render").debug(`end count=${renderCount}`);
  }
}

/**
 *
 */
export function evaluateRenderOps(
  // threadId: string,
  element: PerformerElement,
  node?: PerformerNode,
  parent?: PerformerNode,
  prevSibling?: PerformerNode,
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

  if (node.status === "FINALIZE") {
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
  let childNode: PerformerNode | undefined = node.child;
  let childPrevSibling: PerformerNode | undefined = undefined;
  let childElement: PerformerElement | undefined = element.child;
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
  performer: Performer,
  op: CreateOp | ResumeOp,
): Promise<PerformerNode> {
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
      performer.root = node;
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
  await renderComponent(performer, node);
  // if (node.type instanceof Function) {
  //   await renderComponent(performer, node);
  // } else {
  //   await renderIntrinsic(performer, node);
  // }
  return node;
}

async function renderComponent(performer: Performer, node: PerformerNode) {
  // if (!(node.action instanceof Function)) {
  //   throw new Error(
  //     `Invalid node type: renderComponent() expects 'node.action' to be a function`,
  //   );
  // }
  const logger = getLogger("render:renderComponent");
  // call component and get view function
  // let view: unknown;
  // setRenderScope({
  //   performer,
  //   node,
  //   nonce: 0,
  //   abortController: performer.abortController,
  // });
  try {
    const type = node.element.type;
    if (type instanceof Function) {
      const messages = resolveMessages(performer.root, node);
      let result = await type({
        messages,
        signal: performer.abortController.signal,
      });
      if (result instanceof ReadableStream) {
        node.state.stream = result;
        node.status = "PAUSED";
        const message = await consumeDeltaStream(
          performer,
          node,
          node.state.stream,
        );
        node.state.message = message;
        setNodeFinalize(node);
        logger.debug(
          `${node.element.id} stream resolved. status=${node.status}`,
        );
        performer.queueRender("stream resolved");
      } else if (result && typeof result === "object") {
        if (Array.isArray(result)) {
          throw Error(
            `Invalid Message action return value. Expected object type PerformerMessage. Received array: ${JSON.stringify(result)}`,
          );
        }
        if (!isMessage(result)) {
          throw Error(
            `Invalid Message action return value. Expected type PerformerMessage. Received ${JSON.stringify(result)}.`,
          );
        }
        node.state.message = result;
        setNodeFinalize(node);
        logger.debug(
          `${node.element.id} messages resolved. status=${node.status}`,
        );
      } else if (!result) {
        // return falsey no message will be applied
        setNodeFinalize(node);
        logger.debug(`${node.element.id} resolved. status=${node.status}`);
      } else {
        throw Error(
          `Invalid Message action return value. Received ${JSON.stringify(result)}.`,
        );
      }
    } else if (type === "LISTENER") {
      if (performer.inputQueue.length) {
        node.state.message = performer.inputQueue.shift();
        setNodeFinalize(node);
      } else {
        node.status = "LISTENING";
        logger.debug(`${node.element.id} listening.`);
      }
    } else if (isMessage(type)) {
      node.state.message = type;
      setNodeFinalize(node);
    } else {
      throw Error(`Unexpected message type: ${JSON.stringify(type)}`);
    }
  } catch (e) {
    logger.debug(`${node.element.id} exception. error=${e}`);
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
  //     performer.insert({
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

  // registerView(performer, node, view);
  // } catch (e) {
  //   if (e instanceof DeferResource) {
  //     node.status = "PAUSED";
  //     logPaused(node, "resource");
  //     e.cause.promise
  //       .then(() => {
  //         node.status = "PENDING";
  //         performer.queueRender("deferred resolved");
  //       })
  //       .catch((error) => performer.onError("root", error));
  //   } else if (e instanceof DeferInput) {
  //     node.status = "LISTENING";
  //     logPaused(node, "resource");
  //     performer.setInputNode(node);
  //     performer.queueRender("set input");
  //   } else {
  //     throw e;
  //   }
  // }
}

// async function renderIntrinsic(performer: Performer, node: PerformerNode) {
//   if (typeof node.type !== "string") {
//     throw new Error(
//       `Invalid node type: renderIntrinsic() expects 'node.type' to be a string`,
//     );
//   }
//
//   if (!isRawNode(node)) {
//     node.status = "RESOLVED";
//     logMessageResolved(node);
//     if (!node.isHydrating) {
//       dispatchMessageElement(performer, node);
//       performer.queueRender("message resolved");
//     }
//     return;
//   }
//
//   if (!node.props.stream && !node.props.message) {
//     throw Error("`raw` element requires `stream` OR `message` prop");
//   }
//
//   if (node.props.message != null) {
//     node.status = "RESOLVED";
//     logMessageResolved(node);
//     if (!node.isHydrating) {
//       dispatchMessageElement(performer, node);
//       performer.queueRender("raw resolved");
//     }
//     return;
//   }
//
//   if (node.props.stream != null) {
//     node.status = "PAUSED";
//     const messagePromised = consumeDeltaStream(
//       performer,
//       node,
//       node.props.stream,
//     )
//       .then(async (message) => {
//         node.hooks.message = message;
//         if (node.props.onResolved) {
//           await node.props.onResolved(message);
//         }
//         node.status = "RESOLVED";
//         logMessageResolved(node);
//         if (!node.isHydrating) {
//           dispatchMessageElement(performer, node, message);
//           performer.queueRender("raw stream resolved");
//         }
//       })
//       .catch((error) => performer.onError(node.threadId, error));
//
//     // process stream
//     if (node.isHydrating) {
//       await messagePromised;
//     }
//   }
// }

// function registerView(
//   performer: Performer,
//   node: PerformerNode,
//   view: Function,
// ) {
//   node.disposeView = effect(() => {
//     const viewUpdate = view();
//     node.childElements = normalizeChildren(viewUpdate);
//     if (!node.isHydrating) {
//       performer.queueRender("view updated");
//     }
//   });
// }

// function dispatchMessageElement(
//   performer: Performer,
//   node: PerformerNode,
//   message?: PerformerMessage,
// ) {
//   if (!message) {
//     message = nodeToMessage(node);
//   }
//   performer.dispatchEvent(
//     createMessageEvent(node.threadId, {
//       uid: node.uid,
//       message: structuredClone(message),
//     }),
//   );
//   if (node.props.onMessage && node.props.onMessage instanceof Function) {
//     node.props.onMessage(message);
//   }
// }

async function consumeDeltaStream(
  performer: Performer,
  node: PerformerNode,
  stream: ReadableStream<MessageDelta>,
): Promise<PerformerMessage> {
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

    // performer.dispatchEvent(
    //   // clone chunk so event consumers mutations don't modify this chunk
    //   createDeltaEvent("root", {
    //     uid: node.uid,
    //     delta: structuredClone(chunk),
    //   }),
    // );
    // chunks.push(chunk);
  }
  // if (chunks.length === 0) {
  //   throw Error("Message stream empty");
  // }
  // const message = structuredClone(chunks[0]) as AssistantMessage;
  // if (!message.role) {
  //   throw Error("First chunk in stream does not contain message role.");
  // }
  // let index = 1;
  // while (index < chunks.length) {
  //   const delta = chunks[index];
  //   concatDelta(message as MessageDelta, delta);
  //   index += 1;
  // }
  return message;
}

export function freeElement(element: PerformerElement) {
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
  node: PerformerNode,
  parent?: PerformerNode,
  freeRemaining: boolean = false,
) {
  try {
    getLogger("render:freeNode").debug(
      toLogFmt([
        ["free", "node"],
        ["threadId", "root"],
        // ["node", nodeToStr(node)],
      ]),
    );
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
  from: PerformerNode | undefined,
  to?: PerformerNode,
): PerformerMessage[] {
  let messages: PerformerMessage[] = [];

  let cursor: PerformerNode | undefined = from;
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
    if (cursor.state.message && cursor.status === "RESOLVED") {
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

// export function nodeToMessage(node: PerformerNode): PerformerMessage {
//   if (typeof node.type !== "string") {
//     throw Error(
//       "Cannot convert component to messages, must use intrinsic elements to represent messages",
//     );
//   }
//   if (node.type === "raw") {
//     if (!node.hooks.message && !node.props.message) {
//       throw Error("`message` element not resolved.");
//     }
//     return node.hooks.message || node.props.message;
//   }
//   // fixme refactor without branching
//   else if (node.type === "tool") {
//     return {
//       tool_call_id: node.props.tool_call_id,
//       role: node.type,
//       content: childrenToContent(node.props.children) || node.props.content,
//     };
//   } else if (node.type === "assistant") {
//     return {
//       role: node.type,
//       content: childrenToContent(node.props.children) || node.props.content,
//       ...(node.props.tool_calls ? { tool_calls: node.props.tool_calls } : {}),
//       ...(node.props.function_call
//         ? { function_call: node.props.function_call }
//         : {}),
//     };
//   } else if (node.type === "system") {
//     return {
//       role: node.type,
//       content: childrenToContent(node.props.children) || node.props.content,
//     };
//   } else if (node.type === "user") {
//     return {
//       role: node.type,
//       content: childrenToContent(node.props.children) || node.props.content,
//     };
//   }
//   throw Error(`Unexpected message element ${node.type}`);
// }

function nodeMatchesElement(node: PerformerNode, element: PerformerElement) {
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

// function childrenToContent(children: unknown): string {
//   if (!children) {
//     return "";
//   } else if (Array.isArray(children)) {
//     return children.flat(99).map(String).join("");
//   } else {
//     return String(children);
//   }
// }
//
// function normalizeChildren(
//   children: ReturnType<ComponentReturn>,
// ): PerformerElement[] {
//   if (!children || typeof children === "string") {
//     return [];
//   } else if (Array.isArray(children)) {
//     return children.flat(10).filter(Boolean);
//   } else {
//     return [children];
//   }
// }
