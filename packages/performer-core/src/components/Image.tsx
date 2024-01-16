import { ChatOpenAI } from 'langchain/chat_models/openai';
import OpenAI from 'openai';
import type { Component } from '../component.js';
import { toLangchain } from '../message.js';
import { useMessages } from '../hooks/index.js';
import { DynamicStructuredTool } from 'langchain/tools';
import { z } from 'zod';
import log from 'loglevel';
import { HumanMessage, SystemMessage } from 'langchain/schema';

const imagePromptFunctionName = 'write_image_prompt';
const imagePromptFunction = new DynamicStructuredTool({
	name: imagePromptFunctionName,
	description: `Write an image prompt, a text description used to guide the creation of an image when using AI image generation tools like DALL-E.`,
	schema: z.object({
		prompt: z
			.string()
			.describe(
				'This prompt should contains specific details about what should be depicted in the image, including elements like the setting, subjects, colors, style, and mood.'
			)
	}),
	func: async ({ prompt }) => prompt
});
const imagePromptFunctionSchema = z.object({ prompt: z.string() });

const limits = {
	'dall-e-2': { chars: 1000 },
	'dall-e-3': { chars: 4000 }
};

type Props = {
	content?: string;
	model?: 'dall-e-2' | 'dall-e-3';
	numberOfImages?: number;
	instructions?: string;
};

export const Image: Component<Props> = async ({
	content,
	model = 'dall-e-3',
	numberOfImages = 1,
	instructions
}) => {
	const controller = new AbortController();
	const messages = useMessages();

	const lcMessages = toLangchain(messages);
	if (content) {
		lcMessages.push(new HumanMessage(content));
	}
	lcMessages.push(
		new SystemMessage(
			instructions ||
				`Write a prompt to generate an image using DALL-E 3 based on the previous messages.
			Utilize your extensive knowledge of AI image generation and prompt engineering. Write a detailed and accurate prompt to generate high quality imagery
			to fully capture the subject matter.`
		)
	);
	const tools = [imagePromptFunction];

	const chat = new ChatOpenAI().bind({
		signal: controller.signal,
		tools
	});

	const response = await chat.invoke(lcMessages, {
		tool_choice: { type: 'function', function: { name: imagePromptFunctionName } }
	});
	const toolCall = response.additional_kwargs.tool_calls?.find(
		(t: any) => t.function.name === imagePromptFunctionName
	);
	if (!toolCall) {
		throw new Error('function for image prompt was not called');
	}
	const toolCallArgs = JSON.parse(toolCall.function.arguments);
	let prompt = imagePromptFunctionSchema.parse(toolCallArgs).prompt;

	log.debug('Image prompt: ', prompt);

	const limit = limits[model];
	prompt = prompt.substring(0, limit.chars);

	const openai = new OpenAI();
	const images = await openai.images.generate({
		n: numberOfImages,
		prompt,
		response_format: 'url',
		model
	});

	return () => (
		<assistant
			content={images.data.map((image) => ({ type: 'image_url', image_url: image.url! }))}
		/>
	);
};
