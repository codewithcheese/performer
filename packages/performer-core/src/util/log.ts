import { CoreEvent, CoreNode, isAssistantMessage, RunSession } from "../index.js";
import log from "loglevel";
import { isImageContent, isTextContent } from "../message.js";

export type LogConfig = {
	showUpdateEvents: boolean;
	showResolveMessages: boolean;
};

function getNestedProperty(object: any, propertyPath: string): any {
	return propertyPath
		.split('.')
		.reduce((o, key) => (o && o[key] !== 'undefined' ? o[key] : null), object);
}

export function logEvent(event: CoreEvent, config: LogConfig) {
	if (!config.showUpdateEvents && event.op === 'update') return;

	let msg = `Event ${event.type} ${event.op}`;
	if (event.type === 'MESSAGE') {
		msg += ` ${event.payload.role} `;
		msg +=
			typeof event.payload.content === 'string'
				? event.payload.content
				: event.payload.content
						.map((content) => {
							if (isTextContent(content) && content.text !== '') {
								return `text:${content.text}`;
							} else if (isImageContent(content)) {
								return `image:${content.image_url}`;
							} else {
								return '';
							}
						})
						.join(', ');
		if (isAssistantMessage(event.payload) && event.payload.tool_calls) {
			msg += ` ${event.payload.tool_calls
				.map(
					(toolCall) =>
						`${toolCall.function.name ? toolCall.function.name + ':' : ''}${
							toolCall.function.arguments
						}`
				)
				.join(', ')}`;
		}
	} else if (event.type === 'ERROR') {
		msg += ` ${event.payload.message}`;
	}

	log.debug(msg);
}

export function logObject<T>(object: T, properties: string[]) {
	const loggable = properties
		.map((key) => `${String(key)}=${getNestedProperty(object, String(key))}`)
		.join(' ');
	return loggable.trim();
}

export function logNode(node: CoreNode) {
	return getHierarchy(node).join('->');
}

function getHierarchy(node: CoreNode) {
	const names: string[] = [];
	if (node.parent) names.push(...getHierarchy(node.parent));
	names.push(typeof node.type === 'string' ? node.type : node.type.name);
	return names;
}

export function logSession(session: RunSession, properties = ['id']) {
	return logObject(session, properties);
}

export function logResolveMessages(node: CoreNode | undefined, config: Partial<LogConfig> = {}) {
	if (!config.showResolveMessages) return;
	if (node) {
		log.debug(
			`Resolving messages for ${typeof node.type === 'string' ? node.type : node.type.name}`
		);
	} else {
		log.debug(`Finished resolving messages`);
	}
}
