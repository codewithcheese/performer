import { RenderScope, useRenderScope } from './use-render-scope.js';

export interface Hook<T> {
	readonly value: T;
	readonly set: (v: T) => T;
	readonly scope: RenderScope;
}

export const useHook = <T>(name: string, initValue: T): Hook<T> => {
	const scope = useRenderScope();
	const hooks = (scope.node.hooks ||= {});

	if (!(name in hooks)) {
		hooks[name] = initValue;
	}

	const set = (value: T) => {
		return (hooks[name] = value);
	};

	return {
		value: hooks[name] as T,
		set,
		scope
	};
};
