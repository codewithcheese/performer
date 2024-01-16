import type { CoreMessage } from './message.js';

interface Event {
	sid: string; // non-persistent id for tracking stream of events
	op: 'once' | 'close' | 'update';
	type: string;
	payload: unknown;
}

export interface MessageEvent extends Event {
	type: 'MESSAGE';
	payload: CoreMessage;
}

export interface ErrorEvent extends Event {
	type: 'ERROR';
	payload: {
		message: string;
	};
}

export interface LifecycleEvent extends Event {
	type: 'LIFECYCLE';
	payload: {
		state: 'finished' | 'aborted';
	};
}

export function createMessageEvent(message: CoreMessage): CoreEvent {
	return {
		sid: crypto.randomUUID(),
		op: 'once',
		type: 'MESSAGE',
		payload: message
	};
}

export function isCoreEvent(event: unknown): event is CoreEvent {
	return (
		typeof event === 'object' &&
		event != null &&
		'op' in event &&
		'payload' in event &&
		'type' in event
	);
}

export function isMessageEvent(event: unknown): event is MessageEvent {
	return isCoreEvent(event) && event.type === 'MESSAGE';
}

export function isLifecycleEvent(event: unknown): event is LifecycleEvent {
	return isCoreEvent(event) && event.type === 'LIFECYCLE';
}

export function isErrorEvent(event: unknown): event is ErrorEvent {
	return isCoreEvent(event) && event.type === 'ERROR';
}

export type CoreEvent = MessageEvent | ErrorEvent | LifecycleEvent;
