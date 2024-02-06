import type { Component } from "./component.js";
import { PerformerMessage } from "./message.js";

export type PerformerElement = {
  type: Component<any> | PerformerMessage["role"] | "raw";
  props: Record<string, any>;
};

export function Fragment(props: any) {
  return props.children;
}
