import { type PerformerElement } from "./element.js";
import {
  createNode,
  isRawNode,
  type PerformerNode,
  SerializedNode,
} from "./node.js";
import { clearRenderScope, setRenderScope } from "./hooks/use-render-scope.js";
import type { Performer } from "./performer.js";
import {
  AssistantMessage,
  concatDelta,
  isMessageDelta,
  MessageDelta,
  PerformerMessage,
} from "./message.js";
import log from "loglevel";
import * as _ from "lodash";
import { ComponentReturn } from "./component.js";
import { effect } from "@preact/signals-core";
import {
  nodeToStr,
  logOp,
  toLogFmt,
  logMessageResolved,
  logPaused,
} from "./util/log.js";
import { PerformerDeltaEvent, PerformerMessageEvent } from "./event.js";
import { Fragment } from "./jsx/index.js";
import { DeferInput, DeferResource } from "./util/defer.js";

type CreateOp = {
  type: "CREATE";
  payload: {
    threadId: string;
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
};

export type RenderOp = CreateOp | ResumeOp | PausedOp;

export async function render(performer: Performer) {
  log.debug("call=render");
  try {
    const ops = evaluateRenderOps(
      "root",
      performer.app,
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
      }
    }
    if (Object.keys(ops).length === 0 && !performer.renderQueued) {
      performer.finish();
    }
  } catch (error) {
    performer.onError("root", error);
  }
}

/**
 *
 */
export function evaluateRenderOps(
  threadId: string,
  element: PerformerElement,
  node?: PerformerNode,
  parent?: PerformerNode,
  prevSibling?: PerformerNode,
): Record<string, RenderOp> {
  if (!node || !nodeMatchesElement(node, element)) {
    const op: CreateOp = {
      type: "CREATE",
      payload: {
        threadId,
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
    return { [threadId]: op };
  }

  if (node.status === "PENDING") {
    return {
      [threadId]: {
        type: "RESUME",
        payload: { node },
      } satisfies ResumeOp,
    };
  }

  if (node.status === "PAUSED") {
    return { [threadId]: { type: "PAUSED" } satisfies PausedOp };
  }
  let ops: Record<string, RenderOp> = {};
  let index = 0;
  let childThreadId = node.hooks.thread?.id ? node.hooks.thread.id : threadId;
  let childNode: PerformerNode | undefined = node.child;
  let childPrevSibling: PerformerNode | undefined = undefined;
  const childElements = node.childElements || [];
  while (index < childElements.length) {
    const childElement = childElements[index];
    const childOps = evaluateRenderOps(
      childThreadId,
      childElement,
      childNode,
      node,
      childPrevSibling,
    );
    Object.assign(ops, childOps);
    if (childThreadId in childOps) {
      node.childRenderCount += 1;
      return ops;
    }
    if (childPrevSibling) {
      childPrevSibling.nextSibling = childNode;
    }
    childPrevSibling = childNode;
    childNode = childNode?.nextSibling;

    index += 1;
  }

  // detach remaining node siblings and their children
  if (childNode) {
    freeNode(childNode, node, true);
  }

  if (node.childRenderCount > 0) {
    if (node.hooks.afterChildren) {
      node.hooks.afterChildren();
    }
    node.childRenderCount = 0;
  }

  return ops;
}

export async function performOp(
  performer: Performer,
  op: CreateOp | ResumeOp,
  serialized?: SerializedNode,
): Promise<PerformerNode> {
  let node;
  if (op.type === "CREATE") {
    const { threadId, element, parent, prevSibling, nextSibling, child } =
      op.payload;
    node = createNode({
      threadId,
      element,
      parent,
      prevSibling,
      child,
      serialized,
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
  } else {
    node = op.payload.node;
  }
  if (node.type instanceof Function) {
    await renderComponent(performer, node);
  } else {
    await renderIntrinsic(performer, node);
  }
  return node;
}

async function renderComponent(performer: Performer, node: PerformerNode) {
  if (!(node.type instanceof Function)) {
    throw new Error(
      `Invalid node type: renderComponent() expects 'node.type' to be a function`,
    );
  }
  // call component and get view function
  let view: unknown;
  setRenderScope({
    performer,
    node,
    nonce: 0,
    abortController: performer.controller,
  });
  try {
    view = node.type(node.props);
    if (typeof view !== "function") {
      const returnType = view instanceof Promise ? "Promise" : typeof view;
      throw Error(
        `Component "${nodeToStr(node)}" returned invalid type: ${returnType}. Components must not be an async function, and must return a non-async function when using JSX.\n` +
          `To make async calls in your component use the \`useResource\` hook`,
      );
    }
    registerView(performer, node, view);
    node.status = "RESOLVED";
  } catch (e) {
    if (e instanceof DeferResource) {
      node.status = "PAUSED";
      logPaused(node, "resource");
      e.cause.promise.then(() => {
        node.status = "PENDING";
        performer.queueRender("deferred resolved");
      });
    } else if (e instanceof DeferInput) {
      node.status = "PAUSED";
      logPaused(node, "resource");
      performer.setInputNode(node);
    } else {
      throw e;
    }
  } finally {
    clearRenderScope();
  }
}

async function renderIntrinsic(performer: Performer, node: PerformerNode) {
  if (typeof node.type !== "string") {
    throw new Error(
      `Invalid node type: renderIntrinsic() expects 'node.type' to be a string`,
    );
  }

  if (!isRawNode(node)) {
    node.status = "RESOLVED";
    logMessageResolved(node);
    if (!node.isHydrating) {
      dispatchMessageElement(performer, node);
      performer.queueRender("message resolved");
    }
    return;
  }

  if (!node.props.stream && !node.props.message) {
    throw Error("`raw` element requires `stream` OR `message` prop");
  }

  if (node.props.message != null) {
    node.status = "RESOLVED";
    logMessageResolved(node);
    if (!node.isHydrating) {
      dispatchMessageElement(performer, node);
      performer.queueRender("raw resolved");
    }
    return;
  }

  if (node.props.stream != null) {
    node.status = "PAUSED";
    const messagePromised = consumeDeltaStream(
      performer,
      node,
      node.props.stream,
    )
      .then(async (message) => {
        node.hooks.message = message;
        if (node.props.onResolved) {
          await node.props.onResolved(message);
        }
        node.status = "RESOLVED";
        logMessageResolved(node);
        if (!node.isHydrating) {
          dispatchMessageElement(performer, node, message);
          performer.queueRender("raw stream resolved");
        }
      })
      .catch((error) => performer.onError(node.threadId, error));

    // process stream
    if (node.isHydrating) {
      await messagePromised;
    }
  }
}

function registerView(
  performer: Performer,
  node: PerformerNode,
  view: Function,
) {
  node.disposeView = effect(() => {
    const viewUpdate = view();
    node.childElements = normalizeChildren(viewUpdate);
    if (!node.isHydrating) {
      performer.queueRender("view updated");
    }
  });
}

function dispatchMessageElement(
  performer: Performer,
  node: PerformerNode,
  message?: PerformerMessage,
) {
  if (!message) {
    message = nodeToMessage(node);
  }
  performer.dispatchEvent(
    new PerformerMessageEvent(node.threadId, {
      message: structuredClone(message),
    }),
  );
  if (node.props.onMessage && node.props.onMessage instanceof Function) {
    node.props.onMessage(message);
  }
}

async function consumeDeltaStream(
  performer: Performer,
  node: PerformerNode,
  stream: ReadableStream<MessageDelta>,
): Promise<PerformerMessage> {
  let chunks: MessageDelta[] = [];
  for await (const chunk of stream) {
    if (!isMessageDelta(chunk)) {
      throw Error(
        `Chunk in stream does not match message delta. ${JSON.stringify(chunk)}`,
      );
    }
    performer.dispatchEvent(
      // clone chunk so event consumers mutations don't modify this chunk
      new PerformerDeltaEvent(node.threadId, {
        uid: node.uid,
        delta: structuredClone(chunk),
      }),
    );
    chunks.push(chunk);
  }
  if (chunks.length === 0) {
    throw Error("Message stream empty");
  }
  const message = structuredClone(chunks[0]) as AssistantMessage;
  if (!message.role) {
    throw Error("First chunk in stream does not contain message role.");
  }
  let index = 1;
  while (index < chunks.length) {
    const delta = chunks[index];
    concatDelta(message as MessageDelta, delta);
    index += 1;
  }
  return message;
}

function freeNode(
  node: PerformerNode,
  parent?: PerformerNode,
  freeRemaining: boolean = false,
) {
  try {
    log.debug(
      toLogFmt([
        ["free", "node"],
        ["threadId", node.threadId],
        ["node", nodeToStr(node)],
      ]),
    );
    // dispose view so that its no longer reactive
    if (node.disposeView) {
      node.disposeView();
    }
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
    if (
      to &&
      cursor.hooks.thread &&
      to.threadId === cursor.hooks.thread.id &&
      cursor.hooks.thread.isolated
    ) {
      messages = [];
    }

    if (typeof cursor.type === "string") {
      messages.push(nodeToMessage(cursor));
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
    if (cursor.child && (!to || to.threadId.includes(cursor.child.threadId))) {
      cursor = cursor.child;
      continue;
    }

    while (cursor) {
      if (
        cursor.nextSibling &&
        (!to || to.threadId.includes(cursor.nextSibling.threadId))
      ) {
        cursor = cursor.nextSibling;
        break;
      }
      cursor = cursor.parent;
    }
  }

  return messages;
}

export function nodeToMessage(node: PerformerNode): PerformerMessage {
  if (typeof node.type !== "string") {
    throw Error(
      "Cannot convert component to messages, must use intrinsic elements to represent messages",
    );
  }
  if (node.type === "raw") {
    if (!node.hooks.message && !node.props.message) {
      throw Error("`message` element not resolved.");
    }
    return node.hooks.message || node.props.message;
  }
  // fixme refactor without branching
  else if (node.type === "tool") {
    return {
      tool_call_id: node.props.tool_call_id,
      role: node.type,
      content: childrenToContent(node.props.children) || node.props.content,
    };
  } else if (node.type === "assistant") {
    return {
      role: node.type,
      content: childrenToContent(node.props.children) || node.props.content,
      ...(node.props.tool_calls ? { tool_calls: node.props.tool_calls } : {}),
      ...(node.props.function_call
        ? { function_call: node.props.function_call }
        : {}),
    };
  } else if (node.type === "system") {
    return {
      role: node.type,
      content: childrenToContent(node.props.children) || node.props.content,
    };
  } else if (node.type === "user") {
    return {
      role: node.type,
      content: childrenToContent(node.props.children) || node.props.content,
    };
  }
  throw Error(`Unexpected message element ${node.type}`);
}

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
      (typeof element.type === "symbol" && node.type === Fragment)) &&
    _.isEqualWith(node.element.props, element.props, functionComparison)
  );
}

function childrenToContent(children: unknown): string {
  if (!children) {
    return "";
  } else if (Array.isArray(children)) {
    return children.flat(99).map(String).join("");
  } else {
    return String(children);
  }
}

function normalizeChildren(
  children: ReturnType<ComponentReturn>,
): PerformerElement[] {
  if (!children || typeof children === "string") {
    return [];
  } else if (Array.isArray(children)) {
    return children.flat(10).filter(Boolean);
  } else {
    return [children];
  }
}
