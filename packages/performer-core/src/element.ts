import type { Component } from './component.js';
import { CoreMessage } from './message.js';

export type CoreElement = {
	type: Component<any> | CoreMessage['role'];
	props: Record<string, any>;
};

export function Fragment(props: any) {
	return props.children;
}
