import { assert, expect, test } from 'vitest';
import { Assistant, Repeat, resolveMessages, RunSession, useState } from '../../src/index.js';

test('should repeat 2 times', async () => {
	const app = (
		<>
			<system>X = 0. Answer with scalar.</system>
			<Repeat times={2}>
				<system>Increment X by 1</system>
				<Assistant />
			</Repeat>
		</>
	);
	const session = new RunSession({ element: app });
	session.start();
	await session.waitUntilSettled();
	expect(session.errors).toHaveLength(0);
	expect(session.node?.child?.type).toEqual('system');
	assert(session.node?.child?.nextSibling?.type instanceof Function);
	expect(session.node?.child?.nextSibling?.type.name).toEqual('Repeat');
	expect(session.node?.child?.nextSibling?.child?.type).toEqual('system');
	assert(session.node?.child?.nextSibling?.child?.nextSibling?.type instanceof Function);
	expect(session.node?.child?.nextSibling?.child?.nextSibling?.type.name).toEqual('Assistant');
	expect(session.node?.child?.nextSibling?.child?.nextSibling?.nextSibling?.type).toEqual('system');
	assert(
		session.node?.child?.nextSibling?.child?.nextSibling?.nextSibling?.nextSibling?.type instanceof
			Function
	);
	expect(
		session.node?.child?.nextSibling?.child?.nextSibling?.nextSibling?.nextSibling?.type.name
	).toEqual('Assistant');
	expect(
		session.node?.child?.nextSibling?.child?.nextSibling?.nextSibling?.nextSibling?.nextSibling
	).toEqual(undefined);
	const messages = resolveMessages(session.node);
	console.log(messages);
	// testHydration(session);
}, 10_000);

test('should stop repeating using stop prop', async () => {
	function App() {
		let count = 0; // no signal needed not used in view
		const stop = useState<boolean>(false);
		const onMessage = () => {
			count += 1;
			if (count >= 4) {
				stop.value = true;
			}
		};
		return () => (
			<>
				<system>X = 0. Answer with scalar.</system>
				<Repeat stop={stop}>
					<system onMessage={onMessage}>Increment X by 1</system>
					<Assistant onMessage={onMessage} />
				</Repeat>
			</>
		);
	}
	const session = new RunSession({ element: <App /> });
	session.start();
	await session.waitUntilSettled();
	const messages = resolveMessages(session.node);
	expect(messages.length).toEqual(5);
	// testHydration(session);
}, 10_000);
