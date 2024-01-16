import type { Component } from "./component.js";
import type { CoreElement } from "./element.js";
import type { HookRecord } from "./hooks/index.js";
import { CoreMessage } from "./message.js";

export type CoreNode = {
	type: Component<any> | CoreMessage['role'];
	_typeName: string;
	props: Record<string, any>;
	hooks: Record<string, unknown> & HookRecord;
	element: CoreElement;
	childElements?: CoreElement[];
	disposeView?: () => void;
	dependsOn: Set<string>;

	// linked tree
	parent?: CoreNode;
	child?: CoreNode;
	prevSibling?: CoreNode;
	nextSibling?: CoreNode;
};

export function createNode({
	element,
	parent,
	prevSibling,
	child
}: {
	element: CoreElement;
	parent?: CoreNode;
	prevSibling?: CoreNode;
	child?: CoreNode;
}): CoreNode {
	const node: CoreNode = {
		type: element.type,
		_typeName: typeof element.type === 'string' ? element.type : element.type.name,
		props: element.props,
		element,
		hooks: {},
		dependsOn: new Set(),
		prevSibling,
		child
	};
	if (parent) {
		node.parent = parent;
	}
	return node;
}

export function getNearestParent(node: CoreNode, predicate: (parent: CoreNode) => boolean) {
	let parent: CoreNode | undefined = node.parent;
	while (parent) {
		if (predicate(parent)) {
			return parent;
		}
		parent = parent.parent;
	}
	return parent;
}
