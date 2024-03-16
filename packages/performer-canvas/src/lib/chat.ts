import OpenAI from "openai";
import consola from "consola";
import { AssistantMessage } from "@performer/core";
import { findId, useStore } from "../store.ts";
import { getConnectedEdges, Node, Edge } from "reactflow";

export async function chat(nodeId: string, controller: AbortController) {
  const { nodes, edges, updateNodeData, newNode, getNode } =
    useStore.getState();
  const node = nodes.find((node) => node.id === nodeId);
  if (!node) {
    console.error(`node not found for ${nodeId}`, nodes);
    return;
  }
  const left = node.position.x;
  const bottom = node.position.y + node.height!;

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
  const newId = newNode("editorNode", message, left, bottom + 10);
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
  const assistantNode = getNode(newId);
  newNode(
    "editorNode",
    { role: "user", content: "" },
    assistantNode.position.x,
    assistantNode.position.y + assistantNode.height! + 10,
  );
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
