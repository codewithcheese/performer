import OpenAI from "openai";
import consola from "consola";
import { AssistantMessage } from "@performer/core";
import { findId, useStore } from "../store.ts";
import { getConnectedEdges, Node, Edge, XYPosition } from "reactflow";

export async function parentChat(
  parentId: string,
  position: XYPosition,
  controller: AbortController,
) {
  const { nodes, edges, updateNodeData, newNode, getNode } =
    useStore.getState();
  const parentNode = getNode(parentId);
  if (!parentNode) {
    console.error(`node not found for ${parentId}`, nodes);
    return;
  }

  // resolve messages, get child messages, resolve order
  const childNodes = nodes.filter(
    (node) => node.parentNode && node.parentNode === parentId,
  );
  console.log("childNodes", childNodes);
  const connected = getConnectedEdges(childNodes, edges);
  const connectionMap: Record<string, string> = {};
  let headId: string | undefined;
  let tailId: string | undefined;
  connected.forEach((edge) => {
    connectionMap[edge.source] = edge.target;
    if (!headId || edge.target === headId) {
      headId = edge.source;
    }
    if (!tailId || edge.source === tailId) {
      tailId = edge.target;
    }
  });
  if (!headId) {
    console.error("Thread head not found");
    return;
  }
  const messages = [];
  let cursorId = headId;
  do {
    const node = nodes.find(findId(cursorId))!;
    const message = { role: node.data.role, content: node.data.content };
    messages.push(message);
    cursorId = connectionMap[cursorId];
  } while (cursorId);

  // create completion
  const openai = new OpenAI({
    dangerouslyAllowBrowser: true,
  });
  const stream = await openai.chat.completions.create(
    {
      model: "gpt-4-turbo-preview",
      messages: messages,
      stream: true,
    },
    { signal: controller.signal },
  );

  // add message node
  const message: AssistantMessage = { role: "assistant", content: "" };
  const newId = newNode({
    type: "editorNode",
    data: message,
    parentNode: parentId,
    position,
  });

  // consume completion, update node
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta;
    if ("content" in delta) {
      if (message.content == null) {
        message.content = "";
      }
      message.content += delta.content;
      updateNodeData(newId, message);
    }
  }
}

export async function chat(nodeId: string, controller: AbortController) {
  const { nodes, edges, updateNodeData, newNode, getNode } =
    useStore.getState();
  const node = getNode(nodeId);
  if (!node) {
    console.error(`node not found for ${nodeId}`, nodes);
    return;
  }

  const messages = resolveMessages(nodeId, nodes, edges);
  console.log("messages", messages);
  const openai = new OpenAI({
    dangerouslyAllowBrowser: true,
  });
  const stream = await openai.chat.completions.create(
    {
      model: "gpt-4-turbo-preview",
      messages: messages,
      stream: true,
    },
    { signal: controller.signal },
  );
  const message: AssistantMessage = { role: "assistant", content: "" };
  const newId = newNode({
    type: "editorNode",
    data: message,
    position: {
      x: node.position.x,
      y: node.position.y + node.height! + 10,
    },
  });
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta;
    if ("content" in delta) {
      if (message.content == null) {
        message.content = "";
      }
      message.content += delta.content;
      updateNodeData(newId, message);
    }
  }
  // const assistantNode = getNode(newId);
  // newNode(
  //   "editorNode",
  //   { role: "user", content: "" },
  //   assistantNode.position.x,
  //   assistantNode.position.y + assistantNode.height! + 10,
  // );
}

function resolveMessages(nodeId: string, nodes: Node[], edges: Edge[]) {
  const logger = consola.withTag("resolveMessages");
  const connected = getConnectedEdges(nodes, edges);
  const connectionMap: Record<string, string> = {};
  connected.forEach((edge) => (connectionMap[edge.target] = edge.source));
  logger.info(`Connected to ${nodeId}`, connected);
  const messages = [];
  do {
    const node = nodes.find(findId(nodeId))!;
    const message = { role: node.data.role, content: node.data.content };
    messages.unshift(message);
    nodeId = connectionMap[nodeId];
  } while (nodeId);
  logger.info("Messages", messages);
  return messages;
}
