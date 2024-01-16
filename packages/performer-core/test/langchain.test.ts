import { test } from 'vitest';

import { PromptTemplate } from 'langchain/prompts';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { SystemMessage } from 'langchain/schema';

test('should stream response from chain', async () => {
	const model = new ChatOpenAI({});
	const promptTemplate = PromptTemplate.fromTemplate('Tell me a joke about {topic}');
	const chain = promptTemplate.pipe(model);
	const stream = await chain.stream({ topic: 'bears' });
	// Each chunk has the same interface as a chat message
	for await (const chunk of stream) {
		console.log(chunk?.content);
	}
});

test('should stream response from chat model', async () => {
	const system = new SystemMessage({ content: 'Greet the user' });
	const model = new ChatOpenAI({});
	const stream = await model.stream([system]);
	// Each chunk has the same interface as a chat message
	for await (const chunk of stream) {
		console.log(chunk?.content);
	}
});

test('should cancel stream response from chat model', async () => {
	const system = new SystemMessage({ content: 'Greet the user' });
	const controller = new AbortController();
	const model = new ChatOpenAI({}).bind({ signal: controller.signal });
	const stream = await model.stream([system]);
	// Each chunk has the same interface as a chat message
	controller.abort();
	try {
		for await (const chunk of stream) {
			console.log(chunk?.content);
		}
	} catch (e) {}
});
