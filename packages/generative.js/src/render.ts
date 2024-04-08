import { type GenerativeElement } from "./element.js";
import {
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
  GenerativeMessage,
  isMessage,
  isMessageDelta,
  MessageDelta,
} from "./message.js";
import { getLogger } from "./util/log.js";
import { nanoid } from "nanoid";

let renderCount = 0;

export async function render(generative: Generative, reason: string) {
  if (!generative.app) {
    throw Error("Cannot render before app is assigned");
  }
  getLogger("render").debug(`start=${++renderCount} reason=${reason} `);
  try {
    const node = findNext(
      generative,
      generative.app!,
      generative.root,
      undefined,
      undefined,
    );
    if (node) {
      switch (node.status) {
        case "PENDING":
          await resolve(generative, node);
          break;
        case "LISTENING":
          if (generative.inputQueue.length) {
            node.state.message = generative.inputQueue.shift();
            setNodeResolved(node);
          } else {
            generative.setListening();
          }
          break;
        case "AFTER_CHILDREN":
          node.element.props.afterChildren!(generative.getAllMessages());
          setNodeResolved(node);
          // ensure that render is queue at least once if afterChildren has no effect
          generative.queueRender("after children effect");
          break;
        case "RESOLVED":
          // wait for finalized
          break;
        default:
          throw Error(`Unexpected node status: ${node.status}.`);
      }
    }

    if (!node && !generative.renderQueued) {
      generative.setFinished();
    } else if (node?.status === "LISTENING" && !generative.renderQueued) {
      generative.setListening();
    }
  } catch (error) {
    generative.onError("root", error);
  } finally {
    getLogger("render").debug(`end=${renderCount}`);
  }
}

export function findNext(
  generative: Generative,
  element: GenerativeElement,
  node?: GenerativeNode,
  parent?: GenerativeNode,
  prevSibling?: GenerativeNode,
): GenerativeNode | null {
  if (
    !node ||
    !(
      Object.is(element, node.element) &&
      Object.is(element.type, node.element.type)
    )
  ) {
    // unlink existing node
    if (node) {
      if (node.prevSibling?.nextSibling === node) {
        node.prevSibling.nextSibling = undefined;
      }

      if (node.parent?.child === node) {
        node.parent.child = undefined;
      }
    }

    const newNode: GenerativeNode = {
      id: `${element.id}#${nanoid()}`,
      element,
      state: {
        childRenderCount: 0,
      },
      status: "PENDING",
      parent,
      prevSibling,
      nextSibling: undefined,
      child: undefined,
    };

    if (!parent) {
      generative.root = newNode;
    }

    // link node in place
    if (prevSibling) {
      prevSibling.nextSibling = newNode;
    } else if (parent) {
      // if no prevSibling then must be first child
      parent.child = newNode;
    }
    element.node = newNode;

    return newNode;
  }

  if (node.status === "PENDING") {
    return node;
  }

  if (node.status === "LISTENING") {
    return node;
  }

  if (node.status === "RESOLVED") {
    return node;
  }

  if (node.status === "ERROR") {
    return null;
  }

  let index = 0;
  let childNode: GenerativeNode | undefined = node.child;
  let childPrevSibling: GenerativeNode | undefined = undefined;
  let childElement: GenerativeElement | undefined = element.child;
  while (childElement || childNode) {
    if (!childElement) {
      break;
    }
    const next = findNext(
      generative,
      childElement,
      childNode,
      node,
      childPrevSibling,
    );

    if (next && next.status === "PENDING") {
      node.state.childRenderCount += 1;
    }
    if (next) {
      return next;
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
    freeRemaining(childNode, node);
  }

  if (node.state.childRenderCount > 0 && node.element.props.afterChildren) {
    node.status = "AFTER_CHILDREN";
    node.state.childRenderCount = 0;
    return node;
  }

  return null;
}

async function resolve(generative: Generative, node: GenerativeNode) {
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
        node.state.message = await consumeDeltaStream(node, node.state.stream);
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
}

async function consumeDeltaStream(
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

function freeRemaining(node: GenerativeNode, parent?: GenerativeNode) {
  try {
    getLogger("render:freeRemaining").debug(`id=${node.element.id}`);

    // free depth first
    if (freeRemaining && node.child) {
      freeRemaining(node.child, node);
    }
    if (freeRemaining && node.nextSibling) {
      freeRemaining(node.nextSibling, node);
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
    if (cursor.state.message && cursor.status === "FINALIZED") {
      messages.push(cursor.state.message);
    }

    const exit = to && cursor === to;
    if (exit) {
      break;
    }

    if (cursor.child) {
      cursor = cursor.child;
      continue;
    }

    while (cursor) {
      if (cursor.nextSibling) {
        cursor = cursor.nextSibling;
        break;
      }
      cursor = cursor.parent;
    }
  }

  return messages;
}
