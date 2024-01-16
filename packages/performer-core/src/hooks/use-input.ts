import { useHook } from "./use-hook.js";

export type InputState<T> = {
	resolve: (value: T | PromiseLike<T>) => void;
	reject: (reason?: any) => void;
};

export async function useInput<T>(): Promise<T> {
	return new Promise((resolve, reject) => {
		useHook<InputState<T>>('input', { resolve, reject });
	});
}

export type UseInputHookRecord = {
	input?: InputState<any>;
};
