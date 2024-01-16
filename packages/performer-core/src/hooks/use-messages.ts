import { CoreMessage } from '../message.js';
import { resolveMessages } from '../render.js';
import { useRenderScope } from './use-render-scope.js';

export type MessageHook = CoreMessage[];

export type UseMessagesHookRecord = {
	messages?: MessageHook;
};

export function useMessages() {
	const scope = useRenderScope();
	return resolveMessages(scope.session.node, scope.node, scope.session.logConfig);
}
