import { expect, test } from 'vitest';
import { RunSession, useMessages } from '../../src/index.js';

test('should be able to get messages', async () => {
	function MessageReceiver() {
		const messages = useMessages();
		expect(messages.some((m) => m.role === 'system')).toBe(true);
		return () => {};
	}

	const app = (
		<>
			<system>Greet the user</system>
			<MessageReceiver />
		</>
	);

	const session = new RunSession({ element: app });
	session.start();
	await session.waitUntilFinished;
});
