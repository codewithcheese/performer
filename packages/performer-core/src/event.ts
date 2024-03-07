import type { MessageDelta, PerformerMessage } from "./message.js";
import { nanoid } from "nanoid";
import { extend } from "lodash-es";

export interface PerformerEvent {
  type: string;
  threadId: string;
  detail: Record<string, any>;
}

// class TypedCustomEvent<D> extends CustomEvent<D> {
//   static type: keyof PerformerEventMap;
//   threadId: string;
//   constructor(threadId: string, detail: D) {
//     super(new.target.type, { detail });
//     this.threadId = threadId;
//   }
//   toJSON() {
//     return {
//       type: this.type,
//       detail: this.detail,
//     };
//   }
// }

// export class PerformerErrorEvent extends TypedCustomEvent<{ message: string }> {
//   static type = "error" as const;
//   constructor(threadId: string, error: unknown) {
//     let message;
//     if (typeof error === "string") {
//       message = error;
//     } else if (!(error instanceof Error)) {
//       message = "Undefined error";
//     } else {
//       message = error.message;
//     }
//     super(threadId, { message });
//   }
// }
//
// type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
//
// type MessageEventDetail = { uid: string; message: PerformerMessage };

export class PerformerErrorEvent implements PerformerEvent {
  type = "error";
  threadId: string;
  detail: { message: string };

  constructor(threadId: string, error: unknown) {
    let message;
    if (typeof error === "string") {
      message = error;
    } else if (!(error instanceof Error)) {
      message = "Undefined error";
    } else {
      message = error.message;
    }
    this.threadId = threadId;
    this.detail = { message };
  }
}

// export class PerformerMessageEvent extends TypedCustomEvent<MessageEventDetail> {
//   static type = "message" as const;
//
//   constructor(threadId: string, detail: PartialBy<MessageEventDetail, "uid">) {
//     if (detail.uid === undefined) {
//       detail.uid = nanoid();
//     }
//     super(threadId, detail as MessageEventDetail);
//   }
// }

export class PerformerMessageEvent implements PerformerEvent {
  type = "message";
  threadId: string;
  detail: { uid: string; message: PerformerMessage };

  constructor(
    threadId: string,
    payload: { uid?: string; message: PerformerMessage },
  ) {
    this.threadId = threadId;
    this.detail = { ...payload, uid: payload.uid || nanoid() };
  }
}

export class PerformerDeltaEvent implements PerformerEvent {
  type = "delta";
  threadId: string;
  detail: { uid: string; delta: MessageDelta };

  constructor(
    threadId: string,
    payload: { uid?: string; delta: MessageDelta },
  ) {
    this.threadId = threadId;
    this.detail = { ...payload, uid: payload.uid || nanoid() };
  }
}

// export class PerformerLifecycleEvent extends TypedCustomEvent<{
//   state: "finished" | "aborted" | "listening";
// }> {
//   static type = "lifecycle" as const;
// }

export class PerformerLifecycleEvent implements PerformerEvent {
  type = "lifecycle";
  threadId: string;
  detail: {
    state: "finished" | "aborted" | "listening";
  };

  constructor(
    threadId: string,
    payload: {
      state: "finished" | "aborted" | "listening";
    },
  ) {
    this.threadId = threadId;
    this.detail = payload;
  }
}

// export type PerformerEvent = PerformerEventMap[Exclude<
//   keyof PerformerEventMap,
//   "*"
// >];

export interface PerformerEventMap {
  message: PerformerMessageEvent;
  delta: PerformerDeltaEvent;
  error: PerformerErrorEvent;
  lifecycle: PerformerLifecycleEvent;
  "*": PerformerEvent;
}
