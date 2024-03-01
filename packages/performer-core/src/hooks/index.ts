export * from "./use-after-children.js";
export * from "./use-resource.js";
export * from "./use-context.js";
export * from "./use-dispatch-event.js";
export * from "./use-messages.js";
export * from "./use-hook.js";
export * from "./use-input.js";
export * from "./use-route-data.js";
export * from "./use-state.js";
export * from "./use-tool-data.js";

import { AfterChildrenHookRecord } from "./use-after-children.js";
import { InputHookRecord } from "./use-input.js";
import { StateHookRecord } from "./use-state.js";
import { ContextHookRecord, ProviderHookRecord } from "./use-context.js";
import { UseResourceHookRecord } from "./use-resource.js";

export type HookRecord = AfterChildrenHookRecord &
  InputHookRecord &
  StateHookRecord &
  ContextHookRecord &
  ProviderHookRecord &
  UseResourceHookRecord;
