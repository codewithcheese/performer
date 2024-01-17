import type { PerformerMessage } from "./message.js";

interface Event {
  sid: string; // non-persistent id for tracking stream of events
  op: "once" | "close" | "update";
  type: string;
  payload: unknown;
}

export interface MessageEvent extends Event {
  type: "MESSAGE";
  payload: PerformerMessage;
}

export interface ErrorEvent extends Event {
  type: "ERROR";
  payload: {
    message: string;
  };
}

export interface LifecycleEvent extends Event {
  type: "LIFECYCLE";
  payload: {
    state: "finished" | "aborted";
  };
}

export function createMessageEvent(message: PerformerMessage): PerformerEvent {
  return {
    sid: crypto.randomUUID(),
    op: "once",
    type: "MESSAGE",
    payload: message,
  };
}

export function isPerformerMessage(event: unknown): event is PerformerEvent {
  return (
    typeof event === "object" &&
    event != null &&
    "op" in event &&
    "payload" in event &&
    "type" in event
  );
}

export function isMessageEvent(event: unknown): event is MessageEvent {
  return isPerformerMessage(event) && event.type === "MESSAGE";
}

export function isLifecycleEvent(event: unknown): event is LifecycleEvent {
  return isPerformerMessage(event) && event.type === "LIFECYCLE";
}

export function isErrorEvent(event: unknown): event is ErrorEvent {
  return isPerformerMessage(event) && event.type === "ERROR";
}

export type PerformerEvent = MessageEvent | ErrorEvent | LifecycleEvent;
