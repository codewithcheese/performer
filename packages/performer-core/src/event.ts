import type { MessageDelta, PerformerMessage } from "./message.js";

export interface PerformerEventBase {
  type: string;
  threadId: string;
  detail: Record<string, any>;
}

export interface PerformerErrorEvent extends PerformerEventBase {
  type: "error";
  detail: { message: string };
}

export function createErrorEvent(
  threadId: string,
  { error }: { error: unknown },
): PerformerErrorEvent {
  let message;
  if (typeof error === "string") {
    message = error;
  } else if (!(error instanceof Error)) {
    message = "Undefined error";
  } else {
    message = error.message;
  }
  return {
    type: "error",
    threadId,
    detail: { message },
  };
}

export interface PerformerMessageEvent extends PerformerEventBase {
  type: "message";
  detail: { uid: string; message: PerformerMessage };
}

export function createMessageEvent(
  threadId: string,
  detail: {
    uid?: string;
    message: PerformerMessage;
  },
): PerformerMessageEvent {
  return {
    type: "message",
    threadId,
    detail: {
      ...detail,
      uid: detail.uid || crypto.randomUUID(),
    },
  };
}

export interface PerformerDeltaEvent extends PerformerEventBase {
  type: "delta";
  detail: { uid: string; delta: MessageDelta };
}

export function createDeltaEvent(
  threadId: string,
  detail: {
    uid?: string;
    delta: MessageDelta;
  },
): PerformerDeltaEvent {
  return {
    type: "delta",
    threadId,
    detail: {
      ...detail,
      uid: detail.uid || crypto.randomUUID(),
    },
  };
}

export interface PerformerLifecycleEvent extends PerformerEventBase {
  type: "lifecycle";
  detail: {
    state: "settled" | "aborted" | "listening" | "rendering";
  };
}

export function createLifecycleEvent(
  threadId: string,
  detail: { state: "settled" | "aborted" | "listening" | "rendering" },
): PerformerLifecycleEvent {
  return {
    type: "lifecycle",
    threadId,
    detail,
  };
}

export type PerformerEvent = PerformerEventMap[Exclude<
  keyof PerformerEventMap,
  "*"
>];

export interface PerformerEventMap {
  message: PerformerMessageEvent;
  delta: PerformerDeltaEvent;
  error: PerformerErrorEvent;
  lifecycle: PerformerLifecycleEvent;
  "*": PerformerEvent;
}

interface EventMapBase {
  [key: string]: PerformerEventBase;
}
