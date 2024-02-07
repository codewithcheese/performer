import { type PerformerElement } from "./element.js";
import { createNode, type PerformerNode, SerializedNode } from "./node.js";
import { clearRenderScope, setRenderScope } from "./hooks/use-render-scope.js";
import type { Performer } from "./performer.js";
import {
  AssistantMessage,
  isAssistantMessage,
  isImageContent,
  isMessage,
  isMessageDelta,
  isTextContent,
  MessageDelta,
  PerformerMessage,
  ToolCall,
} from "./message.js";
import log from "loglevel";
import * as _ from "lodash";
import { View } from "./component.js";
import { effect } from "@preact/signals-core";
import {
  LogConfig,
  logContent,
  logNode,
  logResolveMessages,
} from "./util/log.js";
import { createUseResourceHook } from "./hooks/index.js";
import { PerformerDeltaEvent, PerformerMessageEvent } from "./event.js";

export async function render(performer: Performer) {
  try {
    let next = findNextElementToRender(performer.app, performer.root);
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
    performer.onError(error);
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
      node.childRenderCount += 1;
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

  if (node.childRenderCount > 0) {
    if (node.hooks.afterChildren) {
      node.hooks.afterChildren();
    }
    node.childRenderCount = 0;
    return "SIDE_EFFECT";
  }

  return null;
}

export async function renderElement(
  performer: Performer,
  { element, parent, prevSibling, nextSibling, child }: NextElement,
  serialized?: SerializedNode,
): Promise<PerformerNode> {
  const node = createNode({ element, parent, prevSibling, child, serialized });
  log.debug(`Create node`, logNode(node), logContent(node));
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
  if (node.type instanceof Function) {
    // call component and get view function
    let viewPromised: Promise<unknown>;
    try {
      const scope = setRenderScope({ performer, node, nonce: 0 });
      const useResource = createUseResourceHook(scope, performer.controller);
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
      viewPromised
        .then((view) => {
          node.viewResolved = true;
          registerView(performer, node, view);
        })
        .catch((e) => performer.onError(e));
    } else {
      const view = await viewPromised;
      node.viewResolved = true;
      registerView(performer, node, view);
    }
  } else {
    // else intrinsic
    if (node.type === "raw") {
      if (!node.props.stream && !node.props.message) {
        throw Error("`raw` element requires `stream` OR `message` prop");
      }
      if (node.props.stream != null) {
        // process stream
        if (node.isHydrating) {
          node.hooks.message = await consumeDeltaStream(
            performer,
            node,
            node.props.stream,
          );
          node.viewResolved = true;
        } else {
          consumeDeltaStream(performer, node, node.props.stream)
            .then((message) => {
              node.hooks.message = message;
              node.viewResolved = true;
              dispatchMessageElement(performer, node);
              performer.queueRender();
            })
            .catch((error) => performer.onError(error));
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
      new PerformerDeltaEvent({ uid: node.uid, delta: chunk }),
    );
    chunks.push(chunk);
  }
  if (chunks.length === 0) {
    throw Error("Message stream empty");
  }
  const message = chunks[0] as AssistantMessage;
  if (!message.role) {
    throw Error("First chunk in stream does not contain message role.");
  }
  let index = 1;
  while (index < chunks.length) {
    const delta = chunks[index];

    if (delta.content != null) {
      // Check for both null and undefined
      message.content = message.content
        ? message.content + delta.content
        : delta.content;
    }

    // Apply function_call
    if (delta.function_call) {
      if (!message.function_call) {
        message.function_call = { name: "", arguments: "" };
      }
      message.function_call.name += delta.function_call.name ?? "";
      message.function_call.arguments += delta.function_call.arguments ?? "";
    }

    // Apply tool_calls
    if (delta.tool_calls && delta.tool_calls.length > 0) {
      if (!message.tool_calls) {
        message.tool_calls = [];
      }
      delta.tool_calls.forEach((deltaToolCall) => {
        const existingToolCall = message.tool_calls?.find(
          (_, index) => index === deltaToolCall.index,
        );
        if (!existingToolCall) {
          if (!message.tool_calls) {
            message.tool_calls = [];
          }
          message.tool_calls[deltaToolCall.index] = deltaToolCall as ToolCall;
        } else {
          // Example of concatenation/merge logic for existing tool calls
          existingToolCall.id = existingToolCall.id + (deltaToolCall.id ?? "");
          if (deltaToolCall.function) {
            if (!existingToolCall.function) {
              existingToolCall.function = { name: "", arguments: "" };
            }
            existingToolCall.function.name += deltaToolCall.function.name ?? "";
            existingToolCall.function.arguments +=
              deltaToolCall.function.arguments ?? "";
          }
        }
      });
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
      content: node.props.content,
    };
  } else if (node.type === "assistant") {
    return {
      role: node.type,
      content: node.props.content,
      ...(node.props.tool_calls ? { tool_calls: node.props.tool_calls } : {}),
      ...(node.props.function_call
        ? { function_call: node.props.function_call }
        : {}),
    };
  } else if (node.type === "system") {
    return {
      role: node.type,
      content: node.props.content,
    };
  } else if (node.type === "user") {
    return {
      role: node.type,
      content: node.props.content,
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
