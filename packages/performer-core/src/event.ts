import type { PerformerMessage } from "./message.js";
import { TypedEventTarget } from "./util/typed-event-target.js";

// interface EventDetail {
//   sid: string; // non-persistent id for tracking stream of events
//   op: "once" | "close" | "update";
//   type: string;
//   payload: unknown;
// }
//
// export interface MessageEvent extends EventDetail {
//   type: "MESSAGE";
//   payload: PerformerMessage;
// }
//
// // export interface ErrorEvent extends EventDetail {
// //   type: "ERROR";
// //   payload: {
// //     message: string;
// //   };
// // }
//
// export interface LifecycleEvent extends EventDetail {
//   type: "LIFECYCLE";
//   payload: {
//     state: "finished" | "aborted";
//   };
// }

// export function createMessageEvent(message: PerformerMessage): PerformerEvent {
//   return {
//     sid: crypto.randomUUID(),
//     op: "once",
//     type: "MESSAGE",
//     payload: message,
//   };
// }

// export function isPerformerEvent(event: unknown): event is PerformerEvent {
//   return (
//     typeof event === "object" &&
//     event != null &&
//     "op" in event &&
//     "payload" in event &&
//     "type" in event
//   );
// }

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

// class ErrorEvent extends CustomEvent<ErrorEventDetail> {
//   constructor(payload: ErrorEventDetail) {
//     super("error", { detail: payload });
//   }
// }

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

export class MessageEvent extends TypedCustomEvent<
  { uid: string } & (
    | { payload: PerformerMessage }
    | { delta: PerformerMessage }
  )
> {
  static type = "message" as const;
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
