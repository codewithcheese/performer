import type { PerformerMessage } from "./message.js";
import { nanoid } from "nanoid";

export function isMessageEvent(
  event: TypedCustomEvent<unknown>,
): event is MessageEvent {
  return event.type === "message";
}

export function isLifecycleEvent(
  event: TypedCustomEvent<unknown>,
): event is LifecycleEvent {
  return event.type === "lifecycle";
}

export function isErrorEvent(
  event: TypedCustomEvent<unknown>,
): event is ErrorEvent {
  return event.type === "error";
}

class TypedCustomEvent<D> extends CustomEvent<D> {
  static type: keyof PerformerEventMap;
  constructor(detail: D) {
    super(new.target.type, { detail });
  }
  toJSON() {
    return {
      type: this.type,
      detail: this.detail,
    };
  }
}

export class ErrorEvent extends TypedCustomEvent<{ message: string }> {
  static type = "error" as const;
  constructor(error: unknown) {
    let message;
    if (typeof error === "string") {
      message = error;
    } else if (!(error instanceof Error)) {
      message = "Undefined error";
    } else {
      message = error.message;
    }
    super({ message });
  }
}

type MessageDetail = { uid: string } & (
  | { payload: PerformerMessage }
  | { delta: PerformerMessage }
);

type MessageDetailUidOptional = { uid?: string } & (
  | { payload: PerformerMessage }
  | { delta: PerformerMessage }
);

export class MessageEvent extends TypedCustomEvent<MessageDetail> {
  static type = "message" as const;

  constructor(detail: MessageDetailUidOptional) {
    if (detail.uid === undefined) {
      super({ ...detail, uid: nanoid() });
    } else {
      super(detail as MessageDetail);
    }
  }
}

export class LifecycleEvent extends TypedCustomEvent<{
  state: "finished" | "aborted" | "listening";
}> {
  static type = "lifecycle" as const;
}

export type PerformerEvent = MessageEvent | ErrorEvent | LifecycleEvent;

export interface PerformerEventMap {
  message: MessageEvent;
  error: ErrorEvent;
  lifecycle: LifecycleEvent;
  "*": PerformerEvent;
}
