import { UseAfterChildrenHookRecord } from './use-after-children.js';

export * from './use-after-children.js';
export * from './use-context.js';
export * from './use-messages.js';
export * from './use-hook.js';
export * from './use-input.js';
export * from './use-route-data.js';
export * from './use-state.js';

import { UseMessagesHookRecord } from './use-messages.js';
import { UseInputHookRecord } from './use-input.js';
import { UseStateHookRecord } from './use-state.js';
import { UseContextHookRecord } from './use-context.js';

export type HookRecord = UseMessagesHookRecord &
	UseAfterChildrenHookRecord &
	UseInputHookRecord &
	UseStateHookRecord &
	UseContextHookRecord;
