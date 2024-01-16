import { assert, expect, test } from 'vitest';
import { Assistant, createMessageEvent, RunSession, User } from '../src/index.js';

// todo update serialization then remove skip
// test.skip('should resume session', async () => {
// 	const element = (
// 		<>
// 			<system>Greet the user</system>
// 			<Assistant>Hi, how can I help?</Assistant>
// 			<User />
// 		</>
// 	);
// 	const session1 = new RunSession({ element });
// 	session1.start();
// 	await session1.waitUntilSettled();
// 	expect(session1.hasFinished).toEqual(false);
// 	const messages1 = resolveMessages(session1.node);
// 	expect(messages1).toHaveLength(2);
// 	const serialized = serialize(session1.node!);
// 	JSON.stringify(serialized);
// 	const hydrated = hydrate(session1, serialized);
// 	expect(objectValueEquality(hydrated, session1.node)).toEqual(true);
//
// 	// resume session from hydrated node
// 	const session2 = new RunSession({ element, node: hydrated });
// 	session2.start();
// 	expect(session2.hasFinished).toEqual(false);
// 	session2.input(
// 		createMessageEvent({ role: 'user', content: [{ type: 'text', text: 'Hold me close' }] })
// 	);
// 	await session2.waitUntilSettled();
// 	expect(session2.hasFinished).toEqual(true);
// 	const messages2 = resolveMessages(session2.node);
// 	expect(messages2).toHaveLength(3);
// }, 10_000);

test('should wait for input before session is finished', async () => {
	const app = <User />;
	const session = new RunSession({ element: app });
	console.time('Render');
	session.start();
	await session.waitUntilSettled();
	expect(session.inputNode).toBeDefined();
	expect(session.hasFinished).toEqual(false);
	session.input(
		createMessageEvent({ role: 'user', content: [{ type: 'text', text: 'Hold me close' }] })
	);
	await session.waitUntilSettled();
	expect(session.hasFinished).toEqual(true);
});

test('should wait for multiple inputs', async () => {
	const app = (
		<>
			<User />
			<User />
			<User />
		</>
	);
	const session = new RunSession({ element: app });
	console.time('Render');
	session.start();
	await session.waitUntilSettled();
	expect(session.hasFinished).toEqual(false);
	session.input(
		createMessageEvent({ role: 'user', content: [{ type: 'text', text: 'Hold me close' }] })
	);
	await session.waitUntilSettled();
	expect(session.hasFinished).toEqual(false);
	session.input(
		createMessageEvent({ role: 'user', content: [{ type: 'text', text: 'Hold me close' }] })
	);
	await session.waitUntilSettled();
	expect(session.hasFinished).toEqual(false);
	session.input(
		createMessageEvent({ role: 'user', content: [{ type: 'text', text: 'Hold me close' }] })
	);
	await session.waitUntilSettled();
	expect(session.hasFinished).toEqual(true);
});

// test('should abort assistant response', async () => {
// 	const app = (
// 		<>
// 			<system>Hello world in Javascript. Code only.</system>
// 			<Assistant />
// 		</>
// 	);
// 	const session = new RunSession({ element: app });
// 	session.start();
// 	session.abort();
// 	await session.waitUntilSettled();
// });
