import type { Component } from '../component.js';
import { useInput } from '../hooks/index.js';
import { CoreMessage, UserMessage } from '../message.js';

export const User: Component<{
	content?: string;
	onMessage?: (message: CoreMessage) => void;
}> = async function ({ content, onMessage = () => {} }) {
	const messages: UserMessage[] = [];
	if (content) {
		messages.push({ role: 'user', content: [{ type: 'text', text: content }] });
	} else {
		const input = await useInput<UserMessage[]>();
		messages.push(...input);
	}
	messages.map(onMessage);
	return () => messages.map((message) => <user onMessage={onMessage} content={message.content} />);
};
