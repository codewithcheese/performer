import type { Component } from "../component.js";
import { useInput } from "../hooks/index.js";
import { messagesToElements, PerformerMessage } from "../message.js";

export const User: Component<{
  content?: string;
  onMessage?: (message: PerformerMessage) => void;
}> = async function ({ content, onMessage = () => {} }) {
  const messages: PerformerMessage[] = [];
  if (content) {
    messages.push({ role: "user", content: [{ type: "text", text: content }] });
  } else {
    const input = await useInput();
    messages.push(...input);
  }
  messages.map(onMessage);
  return () => messagesToElements(messages);
};
