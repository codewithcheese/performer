import OpenAI from "openai";
import consola from "consola";
import { AssistantMessage } from "@performer/core";
import { findId, useStore } from "./store.ts";
import { getConnectedEdges, Node, Edge } from "reactflow";

export async function chat(nodeId: string) {
  const { nodes, edges, updateNodeData, newNode } = useStore.getState();
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
  const stream = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: messages,
    stream: true,
  });
  const message: AssistantMessage = { role: "assistant", content: "" };
  const newId = newNode("editorNode", message, left, bottom + 10);
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta;
    consola.log("Assistant delta", delta);
    if ("content" in delta) {
      if (message.content == null) {
        message.content = "";
      }
      message.content += delta.content;
      updateNodeData(newId, message);
    }
  }
}

function resolveMessages(nodeId: string, nodes: Node[], edges: Edge[]) {
  const connected = getConnectedEdges(nodes, edges);
  const node = nodes.find(findId(nodeId))!;
  const messages = [{ role: node.data.role, content: node.data.content }];
  for (const edge of connected) {
    if (edge.target !== nodeId) {
      break;
    }
    nodeId = edge.source;
    const node = nodes.find(findId(nodeId));
    if (!node) {
      break;
    }
    messages.unshift({ role: node.data.role, content: node.data.content });
  }
  return messages;
}
