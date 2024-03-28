import type { Component } from "./component.js";
import { PerformerMessage } from "./message.js";

export type PerformerElement = {
  id: string;
  // ref: HTMLElement;
  type: Component<any> /*| PerformerMessage["role"] | "raw"*/;
  props: Record<string, any>;

  notify?: () => void;

  parent?: PerformerElement;
  child?: PerformerElement;
  sibling?: PerformerElement;
};

export function Fragment(props: any) {
  return props.children;
}
