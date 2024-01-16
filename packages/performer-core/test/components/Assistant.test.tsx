import { assert, expect, test } from 'vitest';
import {
	Assistant,
	CoreMessage,
	isAssistantMessage,
	isSystemMessage,
	isToolMessage,
	resolveMessages,
	RunSession,
	Tool,
	type ToolMessage
} from '../../src/index.js';
import 'dotenv/config';
import { z } from 'zod';
import { ChatOpenAI } from 'langchain/chat_models/openai';

test('should call model with messages', async () => {
	const app = (
		<>
			<system>Hello world in Javascript. Code only.</system>
			<Assistant />
		</>
	);
	const session = new RunSession({ element: app });
	session.start();
	await session.waitUntilSettled();
	expect(session.node?.child?.type).toEqual('system');
	expect(session.node?.child?.props.content).toEqual('Hello world in Javascript. Code only.');
	assert(session.node?.child?.nextSibling?.type instanceof Function);
	expect(session.node?.child?.nextSibling?.type.name).toEqual('Assistant');
	expect(session.node?.child?.nextSibling?.child?.type).toEqual('assistant');
	expect(session.node?.child?.nextSibling?.child?.props.content).toBeDefined();
}, 10_000);

test('should call onMessage event handler when content is pre-set', async () => {
	let eventHandlerCalled = false;
	const app = (
		<Assistant onMessage={() => (eventHandlerCalled = true)}>How may I serve the?</Assistant>
	);
	const session = new RunSession({ element: app });
	session.start();
	await session.waitUntilSettled();
	expect(eventHandlerCalled).toEqual(true);
});

test('should call onMessage event handler after assistant response', async () => {
	let eventHandlerCalled = false;
	const app = (
		<>
			<system>1+1. Scalar only, no preamble.</system>
			<Assistant onMessage={() => (eventHandlerCalled = true)} />
		</>
	);
	const session = new RunSession({ element: app });
	session.start();
	await session.waitUntilSettled();
	expect(eventHandlerCalled).toEqual(true);
});

test('should use tool', async () => {
	class HelloTool implements Tool {
		id = 'hello';
		name = 'say_hello';
		description = 'Say hello';
		params = z.object({
			name: z.string()
		});
		async call(params: z.infer<typeof this.params>): Promise<ToolMessage> {
			return {
				id: this.id,
				role: 'tool',
				content: `Hello ${params.name}`
			};
		}
	}
	const tool = new HelloTool();
	const model = new ChatOpenAI({ modelName: 'gpt-4-1106-preview' });
	const eventMessages: CoreMessage[] = [];
	const app = (
		<>
			<system>Say hello to world</system>
			<Assistant
				onMessage={(message) => eventMessages.push(message)}
				model={model}
				toolChoice={tool}
				tools={[tool]}
			/>
		</>
	);
	const session = new RunSession({
		element: app
	});
	session.start();
	await session.waitUntilSettled();
	expect(session.hasFinished).toEqual(true);
	const messages = resolveMessages(session.node);
	expect(messages).toHaveLength(3);
	expect(messages[0].role).toEqual('system');
	assert(isSystemMessage(messages[0]));
	assert(isAssistantMessage(messages[1]));
	assert(isToolMessage(messages[2]));
	assert(messages[1].tool_calls);
	expect(messages[2].role).toEqual('tool');
	expect(messages[2].content).toEqual('Hello world');
	expect(eventMessages).toHaveLength(2);
	expect(eventMessages[0]).toEqual(messages[1]);
	expect(eventMessages[1]).toEqual(messages[2]);
});

test.skipIf(process.env.TEST_MODEL_OLLAMA == null)(
	'should use ollama model phi',
	async () => {
		const { ChatOllama } = await import('langchain/chat_models/ollama');
		const ollama = new ChatOllama({ model: 'phi' });
		const app = (
			<>
				<system>Greet the user concisely.</system>
				<Assistant model={ollama} />
			</>
		);
		const session = new RunSession({
			element: app
		});
		session.start();
		await session.waitUntilSettled();
		expect(session.hasFinished).toEqual(true);
		const messages = resolveMessages(session.node);
		expect(messages).toHaveLength(2);
		expect(messages[0].role).toEqual('system');
		expect(messages[1].role).toEqual('assistant');
	},
	60_000
);
