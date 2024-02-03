import type { Component } from "../component.js";
import { useInput } from "../hooks/index.js";
import { messagesToElements, PerformerMessage } from "../message.js";

export const User: Component<{
  onMessage?: (message: PerformerMessage) => void;
}> = async function ({ onMessage = () => {} }) {
  const messages = await useInput();
  return () => messagesToElements(messages, onMessage);
};
