import OpenAI from "openai";
import consola from "consola";
import { AssistantMessage } from "@performer/core";
import { useStore } from "./store.ts";

export async function chat(nodeId: string) {
  const { nodes, newNode, updateNodeData } = useStore.getState();
  const node = nodes.find((node) => node.id === nodeId);
  if (!node) {
    console.error(`node not found for ${nodeId}`, nodes);
    return;
  }
  const openai = new OpenAI({
    dangerouslyAllowBrowser: true,
  });
  const stream = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [{ role: node.data.role, content: node.data.content }],
    stream: true,
  });
  const message: AssistantMessage = { role: "assistant", content: "" };
  const newId = newNode("editorNode", message);
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
