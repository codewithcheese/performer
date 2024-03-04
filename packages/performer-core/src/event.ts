import type { MessageDelta, PerformerMessage } from "./message.js";
import { nanoid } from "nanoid";

class TypedCustomEvent<D> extends CustomEvent<D> {
  static type: keyof PerformerEventMap;
  threadId: string;
  constructor(threadId: string, detail: D) {
    super(new.target.type, { detail });
    this.threadId = threadId;
  }
  toJSON() {
    return {
      type: this.type,
      detail: this.detail,
    };
  }
}

export class PerformerErrorEvent extends TypedCustomEvent<{ message: string }> {
  static type = "error" as const;
  constructor(threadId: string, error: unknown) {
    let message;
    if (typeof error === "string") {
      message = error;
    } else if (!(error instanceof Error)) {
      message = "Undefined error";
    } else {
      message = error.message;
    }
    super(threadId, { message });
  }
}

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

type MessageEventDetail = { uid: string; message: PerformerMessage };

export class PerformerMessageEvent extends TypedCustomEvent<MessageEventDetail> {
  static type = "message" as const;

  constructor(threadId: string, detail: PartialBy<MessageEventDetail, "uid">) {
    if (detail.uid === undefined) {
      detail.uid = nanoid();
    }
    super(threadId, detail as MessageEventDetail);
  }
}

type DeltaEventDetail = { uid: string; delta: MessageDelta };

export class PerformerDeltaEvent extends TypedCustomEvent<DeltaEventDetail> {
  static type = "delta" as const;

  constructor(threadId: string, detail: PartialBy<DeltaEventDetail, "uid">) {
    if (detail.uid === undefined) {
      detail.uid = nanoid();
    }
    super(threadId, detail as DeltaEventDetail);
  }
}

export class PerformerLifecycleEvent extends TypedCustomEvent<{
  state: "finished" | "aborted" | "listening";
}> {
  static type = "lifecycle" as const;
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
