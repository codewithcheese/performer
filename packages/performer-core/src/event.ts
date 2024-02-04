import type { PerformerMessage } from "./message.js";
import { nanoid } from "nanoid";

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

export class PerformerErrorEvent extends TypedCustomEvent<{ message: string }> {
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

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

type MessageDetail = { uid: string; message: PerformerMessage };

export class PerformerMessageEvent extends TypedCustomEvent<MessageDetail> {
  static type = "message" as const;

  constructor(detail: PartialBy<MessageDetail, "uid">) {
    if (detail.uid === undefined) {
      detail.uid = nanoid();
    }
    super(detail as MessageDetail);
  }
}

export class PerformerDeltaEvent extends TypedCustomEvent<MessageDetail> {
  static type = "delta" as const;

  constructor(detail: PartialBy<MessageDetail, "uid">) {
    if (detail.uid === undefined) {
      detail.uid = nanoid();
    }
    super(detail as MessageDetail);
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
