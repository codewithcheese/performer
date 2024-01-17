import { type PerformerElement } from "./element.js";
import { type PerformerNode, createNode } from "./node.js";
import { setRenderScope, clearRenderScope } from "./hooks/use-render-scope.js";
import type { Performer } from "./performer.js";
import type { PerformerMessage } from "./message.js";
import log from "loglevel";
import _ from "lodash";
import { View } from "./component.js";
import { effect } from "@preact/signals-core";
import { LogConfig, logNode, logResolveMessages } from "./util/log.js";

export async function render(performer: Performer) {
  try {
    let next: ReturnType<typeof findNextElementToRender>;
    if (!performer.node) {
      next = {
        element: performer.element,
        parent: undefined,
        prevSibling: undefined,
        nextSibling: undefined,
      };
    } else {
      next = findNextElementToRender(performer.node);
    }
    if (next === "SIDE_EFFECT") {
      performer.queueRender();
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
      performer.onError(error);
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
  parent: PerformerNode,
): NextElement | "SIDE_EFFECT" | null {
  let index = 0;
  let node: PerformerNode | undefined = parent.child;
  let prevSibling: PerformerNode | undefined = undefined;
  const children = parent.childElements || [];
  while (index < children.length) {
    const element = children[index];
    if (!node || !nodeMatchesElement(node, element)) {
      return {
        element,
        parent: parent,
        prevSibling,
        nextSibling: node?.nextSibling,
        child: node?.child,
      };
    }

    if (node.childElements?.length) {
      if (!node.child) {
        return {
          element: node.childElements[0],
          parent: node,
          prevSibling: undefined,
          nextSibling: undefined,
        };
      } else {
        const nextElement = findNextElementToRender(node);
        if (nextElement) {
          return nextElement;
        }
      }
    }

    if (node.hooks.afterChildren) {
      const update = node.hooks.afterChildren();
      if (update) return "SIDE_EFFECT";
    }

    prevSibling = node;
    node = node.nextSibling;

    index += 1;
  }

  // detach remaining node siblings
  while (node) {
    log.debug(
      `Free node ${typeof node.type === "string" ? node.type : node.type.name}`,
    );
    let next: PerformerNode | undefined = node.nextSibling;
    if (node.parent?.child === node) {
      node.parent.child = undefined;
    }
    if (node.prevSibling) {
      node.prevSibling.nextSibling = undefined;
    }
    node.parent = undefined;
    node.prevSibling = undefined;
    node.nextSibling = undefined;
    if (node.disposeView) {
      node.disposeView();
    }
    node = next;
  }

  return null;
}

function validateElement(element: PerformerElement) {
  if (
    element == null ||
    Array.isArray(element) ||
    typeof element !== "object"
  ) {
    const invalidType =
      element == null
        ? "null"
        : Array.isArray(element)
          ? "array"
          : typeof element;
    throw Error(`Invalid child element type "${invalidType}"`);
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
  // fixme refactor without branching
  if (node.type === "tool") {
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

async function renderElement(
  performer: Performer,
  { element, parent, prevSibling, nextSibling, child }: NextElement,
): Promise<PerformerNode> {
  const node = createNode({ element, parent, prevSibling, child });
  log.debug(`Create node`, logNode(node));
  if (!parent) {
    performer.node = node;
  }
  // link node in place
  if (prevSibling) {
    prevSibling.nextSibling = node;
  } else if (parent) {
    parent.child = node;
  }
  if (nextSibling) {
    nextSibling.prevSibling = node;
  }
  if (node.type instanceof Function) {
    // call component and get view function
    let viewPromised: unknown | Promise<unknown>;
    try {
      setRenderScope({ performer, node, nonce: 0 });
      viewPromised = node.type({
        ...node.props,
        controller: performer.abortController,
      });
    } finally {
      clearRenderScope();
    }
    const requiresInput = node.hooks.input != null;
    if (requiresInput) {
      performer.setInputNode(node);
    }
    const view = await viewPromised;
    if (view) {
      if (!(view instanceof Function)) {
        throw Error(
          `Component ${node.type.name} did not return a function. Components must return a function when using JSX.`,
        );
      }
      // register view as an effect
      node.disposeView = effect(() => {
        const viewUpdate = view();
        node.childElements = normalizeChildren(viewUpdate);
        performer.queueRender();
      });
    } else {
      performer.queueRender();
    }
  } else {
    // else intrinsic
    if (node.props.onMessage && node.props.onMessage instanceof Function) {
      node.props.onMessage(nodeToMessage(node));
    }
    performer.queueRender();
  }
  return node;
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

// export function serialize(node: CoreNode): any {
// 	return traverse(node, (key, value, _path) => {
// 		if (key[0] === '_') {
// 			return;
// 		}
// 		if (key === 'type' && value instanceof Function) {
// 			return value.name;
// 		}
// 		if (['child', 'nextSibling'].includes(key)) {
// 			return value;
// 		}
// 		if (['parent', 'prevSibling'].includes(key)) {
// 			return;
// 		}
// 		if (value instanceof Set) {
// 			return Array.from(value);
// 		}
// 		if (
// 			typeof value === 'object' ||
// 			typeof value === 'string' ||
// 			typeof value === 'number' ||
// 			typeof value === 'boolean' ||
// 			value == null
// 		) {
// 			return value;
// 		}
// 	});
// }
//
// export function hydrate(
// 	session: RunSession,
// 	serialized: Record<string, any>,
// 	parent?: any,
// 	prevSibling?: any
// ): CoreNode {
// 	if (!(serialized.type in ComponentMap)) {
// 		throw Error(`${serialized.type} not in ComponentMap`);
// 	}
// 	const node: any = {
// 		..._.omit(serialized, 'parent', 'prevSibling', 'child', 'nextSibling'),
// 		type: ComponentMap[serialized.type],
// 		_typeName: serialized.type
// 	};
// 	if (node.props === undefined) {
// 		node.props = {};
// 	}
// 	if (parent) {
// 		node.parent = parent;
// 	}
// 	if (prevSibling) {
// 		node.prevSibling = prevSibling;
// 	}
// 	if (node.dependsOn) {
// 		node.dependsOn = new Set(node.dependsOn);
// 	}
// 	if (node.props.children) {
// 		node.props.children = node.props.children.map((child: any) => {
// 			if (!(child.type in ComponentMap)) {
// 				throw Error(`${child.type} not in ComponentMap`);
// 			}
// 			return {
// 				...child,
// 				type: ComponentMap[child.type],
// 				_typeName: child.type
// 			};
// 		});
// 	}
// 	// render after parent assignment, before children or siblings
// 	setCurrentSession(session);
// 	// renderElement(node);
// 	clearCurrentSession();
// 	if (serialized.child) {
// 		node.child = hydrate(session, serialized.child, node);
// 	}
// 	if (serialized.nextSibling) {
// 		node.nextSibling = hydrate(session, serialized.nextSibling, parent, node);
// 	}
// 	return node;
// }
