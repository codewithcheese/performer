import { type PerformerElement } from "./element.js";
import { createNode, type PerformerNode, SerializedNode } from "./node.js";
import { clearRenderScope, setRenderScope } from "./hooks/use-render-scope.js";
import type { Performer } from "./performer.js";
import {
  isAssistantMessage,
  isImageContent,
  isMessage,
  isTextContent,
  PerformerMessage,
} from "./message.js";
import log from "loglevel";
import * as _ from "lodash";
import { View } from "./component.js";
import { effect } from "@preact/signals-core";
import { LogConfig, logNode, logResolveMessages } from "./util/log.js";
import { createUseResourceHook } from "./hooks/index.js";
import {
  PerformerDeltaEvent,
  PerformerErrorEvent,
  PerformerMessageEvent,
} from "./event.js";

export async function render(performer: Performer) {
  try {
    let next = findNextElementToRender(performer.element, performer.node);
    if (next === "SIDE_EFFECT") {
      performer.queueRender();
    } else if (next === "VIEW_PENDING") {
      // wait for next render
      return;
    } else if (next) {
      await renderElement(performer, next);
    } else {
      performer.finish();
    }
  } catch (error) {
    performer.finish();
    if (performer.throwOnError) {
      throw error;
    } else {
      performer.dispatchEvent(new PerformerErrorEvent(error));
    }
  }
}

type NextElement = {
  element: PerformerElement;
  parent?: PerformerNode;
  prevSibling?: PerformerNode;
  nextSibling?: PerformerNode;
  child?: PerformerNode;
};

export function findNextElementToRender(
  element: PerformerElement,
  node?: PerformerNode,
  parent?: PerformerNode,
  prevSibling?: PerformerNode,
): NextElement | "SIDE_EFFECT" | null | "VIEW_PENDING" {
  if (!node || !nodeMatchesElement(node, element)) {
    const next = {
      element,
      parent: parent,
      prevSibling: prevSibling,
      nextSibling: node?.nextSibling,
      child: node?.child,
    };
    if (node) {
      // do not free children, the new node will be linked in place and then children
      // re-evaluated on next renders
      freeNode(node, parent, false);
    }
    return next;
  }

  if (!node.viewResolved) {
    return "VIEW_PENDING";
  }

  let index = 0;
  let childNode: PerformerNode | undefined = node.child;
  let childPrevSibling: PerformerNode | undefined = undefined;
  const childElements = node.childElements || [];
  while (index < childElements.length) {
    const childElement = childElements[index];
    const nextElement = findNextElementToRender(
      childElement,
      childNode,
      node,
      childPrevSibling,
    );
    if (nextElement) {
      return nextElement;
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

  if (node.hooks.afterChildren) {
    const update = node.hooks.afterChildren();
    if (update) return "SIDE_EFFECT";
  }

  return null;
}

export async function renderElement(
  performer: Performer,
  { element, parent, prevSibling, nextSibling, child }: NextElement,
  serialized?: SerializedNode,
): Promise<PerformerNode> {
  const node = createNode({ element, parent, prevSibling, child, serialized });
  log.debug(`Create node`, logNode(node));
  if (!parent) {
    performer.node = node;
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
  if (node.type instanceof Function) {
    // call component and get view function
    let viewPromised: Promise<unknown>;
    try {
      const scope = setRenderScope({ performer, node, nonce: 0 });
      const useResource = createUseResourceHook(
        scope,
        performer.abortController,
      );
      const componentReturn = node.type(node.props, { useResource });
      if (!(componentReturn instanceof Promise)) {
        viewPromised = Promise.resolve(componentReturn);
      } else {
        viewPromised = componentReturn;
      }
    } finally {
      clearRenderScope();
    }
    const requiresInput =
      node.hooks.input && node.hooks.input.state === "pending";
    if (requiresInput) {
      performer.setInputNode(node);
      viewPromised.then((view) => {
        node.viewResolved = true;
        registerView(performer, node, view);
      });
    } else {
      const view = await viewPromised;
      node.viewResolved = true;
      registerView(performer, node, view);
    }
  } else {
    // else intrinsic
    if (node.type === "message") {
      if (!node.props.stream && !node.props.message) {
        throw Error("`message` element requires `stream` OR `message` prop");
      }
      if (node.props.stream != null) {
        // process stream
        if (node.isHydrating) {
          node.props.message = await consumeMessageStream(
            performer,
            node,
            node.props.stream,
          );
          node.viewResolved = true;
        } else {
          consumeMessageStream(performer, node, node.props.stream).then(
            (message) => {
              node.props.message = message;
              node.viewResolved = true;
              dispatchMessageElement(performer, node);
              performer.queueRender();
            },
          );
        }
      } else if (node.props.message != null) {
        node.viewResolved = true;
        if (!node.isHydrating) {
          dispatchMessageElement(performer, node);
          performer.queueRender();
        }
      }
    } else {
      node.viewResolved = true;
      if (!node.isHydrating) {
        dispatchMessageElement(performer, node);
        performer.queueRender();
      }
    }
  }
  return node;
}

function registerView(
  performer: Performer,
  node: PerformerNode,
  view: unknown,
) {
  if (!view) {
    if (!node.isHydrating) {
      performer.queueRender();
    }
    return;
  } else if (!(view instanceof Function)) {
    throw Error(
      `Component ${logNode(node)} did not return a function. Components must return a function when using JSX.`,
    );
  }
  // register view as an effect
  node.disposeView = effect(() => {
    const viewUpdate = view();
    node.childElements = normalizeChildren(viewUpdate);
    if (!node.isHydrating) {
      performer.queueRender();
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
  performer.dispatchEvent(new PerformerMessageEvent({ message }));
  if (node.props.onMessage && node.props.onMessage instanceof Function) {
    node.props.onMessage(message);
  }
}

async function consumeMessageStream(
  performer: Performer,
  node: PerformerNode,
  stream: ReadableStream<PerformerMessage>,
) {
  let chunks: PerformerMessage[] = [];
  for await (const chunk of stream) {
    if (!isMessage(chunk)) {
      throw Error(`Non-message chunk in stream. ${JSON.stringify(chunk)}`);
    }
    performer.dispatchEvent(
      new PerformerDeltaEvent({ uid: node.uid, message: chunk }),
    );
    chunks.push(chunk);
  }
  if (chunks.length === 0) {
    throw Error("Message stream empty");
  }
  const message = structuredClone(chunks[0]);
  let index = 1;
  while (index < chunks.length) {
    const chunk = chunks[index];
    // aggregate function call
    if (
      isAssistantMessage(chunk) &&
      isAssistantMessage(message) &&
      chunk.function_call &&
      message.function_call
    ) {
      message.function_call.arguments += chunk.function_call.arguments;
    }
    // aggregate tool calls
    if (
      isAssistantMessage(chunk) &&
      isAssistantMessage(message) &&
      chunk.tool_calls &&
      message.tool_calls
    ) {
      for (const [index, toolCall] of chunk.tool_calls.entries()) {
        message.tool_calls[index].function.arguments +=
          toolCall.function.arguments;
      }
    }

    // aggregate content
    if (isAssistantMessage(chunk)) {
      // fixme always append to last not index
      for (const [i, chunkEntry] of chunk.content.entries()) {
        const aggregateEntry = message.content[i];
        if (isTextContent(chunkEntry) && isTextContent(aggregateEntry)) {
          aggregateEntry.text += chunkEntry.text;
        } else if (
          isImageContent(chunkEntry) &&
          isImageContent(aggregateEntry)
        ) {
          aggregateEntry.image_url += chunkEntry.image_url;
        }
      }
    }
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
    log.debug(`Free node`, logNode(node));
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
  logConfig?: Partial<LogConfig>,
): PerformerMessage[] {
  const messages: PerformerMessage[] = [];

  function traverse(node: PerformerNode | undefined): boolean {
    if (node == null) return false;
    logResolveMessages(node, logConfig);
    // If target node is found, stop traversing
    if (to && node === to) return true;
    // Add messages from the current node
    if (typeof node.type === "string") {
      messages.push(nodeToMessage(node));
    }
    // Traverse child and siblings
    return traverse(node.child) || traverse(node.nextSibling);
  }

  traverse(from);
  return messages;
}

function nodeToMessage(node: PerformerNode): PerformerMessage {
  if (typeof node.type !== "string") {
    throw Error(
      "Cannot convert component to messages, must use intrinsic elements to represent messages",
    );
  }
  if (node.type === "message") {
    if (!node.props.message) {
      throw Error("`message` element not resolved.");
    }
    return node.props.message;
  }
  // fixme refactor without branching
  else if (node.type === "tool") {
    return {
      id: node.props.id,
      role: node.type,
      content: node.props.content,
    };
  } else if (node.type === "assistant") {
    return {
      role: node.type,
      content:
        typeof node.props.content === "string"
          ? [{ type: "text", text: node.props.content }]
          : node.props.content,
      ...(node.props.tool_calls ? { tool_calls: node.props.tool_calls } : {}),
      ...(node.props.function_call
        ? { function_call: node.props.function_call }
        : {}),
    };
  } else {
    return {
      role: node.type,
      content:
        typeof node.props.content === "string"
          ? [{ type: "text", text: node.props.content }]
          : node.props.content,
    };
  }
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
  return (
    node.element.type === element.type &&
    _.isEqualWith(node.element.props, element.props, functionComparison)
  );
}

function normalizeChildren(children: ReturnType<View>): PerformerElement[] {
  if (!children || typeof children === "string") {
    return [];
  } else if (Array.isArray(children)) {
    return children.flat(10).filter(Boolean);
  } else {
    return [children];
  }
}
