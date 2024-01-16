import { useHook } from './use-hook.js';

export function useAfterChildren(callback: () => boolean) {
	useHook<() => void>('afterChildren', callback);
}

type AfterChildrenHookKey = `afterChildren`;

export type UseAfterChildrenHookRecord = {
	// more relaxed than unknown
	[key in AfterChildrenHookKey]?: () => boolean;
};
