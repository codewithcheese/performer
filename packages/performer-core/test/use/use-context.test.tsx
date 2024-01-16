import { expect, test, assert, assertType } from 'vitest';
import { createContextId, initContext, RunSession, useContext } from '../../src/index.js';
import { Signal } from '@preact/signals-core';

test('should use context from provider', async () => {
	const firstContextId = createContextId<string>('first');
	const secondContextId = createContextId<string>('second');
	function Provider(props: any) {
		initContext(firstContextId, 'Hello world');
		initContext(secondContextId, 'Good night');
		return () => props.children;
	}
	function Consumer(props: any) {
		const second = useContext(secondContextId);
		const first = useContext(firstContextId);
		expect(second.value).toEqual('Good night');
		expect(first.value).toEqual('Hello world');
		return () => props.children;
	}

	const app = (
		<Provider>
			<Consumer />
		</Provider>
	);
	const session = new RunSession({ element: app });
	session.start();
	await session.waitUntilFinished;
	expect(session.node?.type).toEqual(Provider);
	expect((session.node?.hooks['context-first'] as Signal<string>).value).toEqual('Hello world');
	expect((session.node?.hooks['context-second'] as Signal<string>).value).toEqual('Good night');
	expect(session.node?.child?.type).toEqual(Consumer);
	expect(session.node?.child?.hooks['provider-first']?.type).toEqual(Provider);
	expect(session.node?.child?.hooks['provider-second']?.type).toEqual(Provider);
});
