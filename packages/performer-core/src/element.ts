import { ActionType } from "./action.js";
import { PerformerNode } from "./node.js";
import { PerformerMessage } from "./message.js";

export type PerformerElement = {
  id: string;
  type: ActionType | "LISTENER" | PerformerMessage;
  props: { afterChildren?: () => void };
  onFinalize: () => void;
  onStreaming: () => void;
  onError: (error: unknown) => void;
  // links
  parent?: PerformerElement;
  child?: PerformerElement;
  sibling?: PerformerElement;
  node?: PerformerNode;
};
