import { expect, test, assert } from 'vitest';
import { CoreMessage, resolveMessages, RunSession, SystemMessage } from '../../src/index.js';

test('should add system message with content', () => {
	const systemMessage: SystemMessage = {
		role: 'system' as const,
		content: [{ type: 'text', text: 'Hello world' }]
	};
	const onMessage = (message: CoreMessage) => expect(message).toEqual(systemMessage);
	const element = <system onMessage={onMessage}>Hello world</system>;
	const session = new RunSession({ element });
	session.start();
	const messages = resolveMessages(session.node);
	expect(messages[0]).toEqual(systemMessage);
});
