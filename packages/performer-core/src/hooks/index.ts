export * from "./use-after-children.js";
export * from "./use-resource.js";
export * from "./use-context.js";
export * from "./use-abort-controller.js";
export * from "./use-dispatch-event.js";
export * from "./use-messages.js";
export * from "./use-hook.js";
export * from "./use-input.js";
export * from "./use-logger.js";
export * from "./use-route-data.js";
export * from "./use-state.js";
export * from "./use-tool-data.js";
export * from "./use-thread.js";

import { AfterChildrenHookRecord } from "./use-after-children.js";
import { InputHookRecord } from "./use-input.js";
import { StateHookRecord } from "./use-state.js";
import { ContextHookRecord, ProviderHookRecord } from "./use-context.js";
import { UseResourceHookRecord } from "./use-resource.js";
import { ThreadHookRecord } from "./use-thread.js";

export type HookRecord = AfterChildrenHookRecord &
  InputHookRecord &
  StateHookRecord &
  ContextHookRecord &
  ProviderHookRecord &
  ThreadHookRecord &
  UseResourceHookRecord;
