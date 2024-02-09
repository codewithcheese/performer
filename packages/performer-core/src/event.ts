import type { MessageDelta, PerformerMessage } from "./message.js";
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

type MessageEventDetail = { uid: string; message: PerformerMessage };

export class PerformerMessageEvent extends TypedCustomEvent<MessageEventDetail> {
  static type = "message" as const;

  constructor(detail: PartialBy<MessageEventDetail, "uid">) {
    if (detail.uid === undefined) {
      detail.uid = nanoid();
    }
    super(detail as MessageEventDetail);
  }
}

type DeltaEventDetail = { uid: string; delta: MessageDelta };

export class PerformerDeltaEvent extends TypedCustomEvent<DeltaEventDetail> {
  static type = "delta" as const;

  constructor(detail: PartialBy<DeltaEventDetail, "uid">) {
    if (detail.uid === undefined) {
      detail.uid = nanoid();
    }
    super(detail as DeltaEventDetail);
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
