import type { Component } from "../component.js";
import { PerformerElement } from "../element.js";
import {
  AssistantMessage,
  MessageDelta,
  PerformerMessage,
  SystemMessage,
  ToolMessage,
  UserMessage,
} from "../message.js";

type IntrinsicProps = { onMessage?: (message: PerformerMessage) => void };

export namespace JSX {
  export type ElementType = Component<any> | string;
  export type Element = PerformerElement;
  export interface ElementChildrenAttribute {
    children: PerformerElement | string;
  }
  // fixme infer
  export type IntrinsicElements = {
    user: IntrinsicProps &
      ({ content: UserMessage["content"] } | { children: string | string[] });
    assistant: IntrinsicProps &
      Omit<AssistantMessage, "content" | "role"> &
      (
        | { content: AssistantMessage["content"] }
        | { children: string | string[] }
      );
    system: IntrinsicProps &
      ({ content: SystemMessage["content"] } | { children: string | string[] });
    tool: IntrinsicProps &
      (
        | { id: ToolMessage["tool_call_id"]; content?: ToolMessage["content"] }
        | { children: string | string[] }
      );
    raw: IntrinsicProps & {
      message?: PerformerMessage;
      stream?: ReadableStream<MessageDelta>;
      onResolved?: (message: PerformerMessage) => void;
    };
  };
}

// type MappedCoreMessages = {
// 	[K in CoreMessage['role']]: Omit<Extract<CoreMessage, { role: K }>, 'role'> & {
// 		content?: CoreMessage['content'];
// 	};
// };

export function Fragment({ children }: any) {
  return () => children;
}

type Props = Record<string, any> & { children?: any };

const hasOwnProperty = Object.prototype.hasOwnProperty;

/**
 * PerformerElement is compatible with ReactElement, so that bundlers
 * may use the React JSX transpiler for both, simplifying bundler config.
 *
 * Adapted directly from React's jsxProd.
 * https://github.com/facebook/react/blob/5fb2c93f3924ba980444da5698f60651b5ef0689/packages/react/src/jsx/ReactJSXElement.js#L209
 */
export function jsxProd(
  type: any,
  config: Record<string, any>,
): PerformerElement {
  let propName;

  const props: Record<string, any> = {};

  for (propName in config) {
    if (hasOwnProperty.call(config, propName)) {
      props[propName] = config[propName];
    }
  }

  return {
    type,
    // @ts-expect-error for debugging
    _typeName: type?.name,
    props,
  };
}

export const jsx = jsxProd;

export function jsxs<Type extends Component<P>, P extends Props>(
  type: Type,
  props: P,
): PerformerElement {
  return jsx(type, props);
}

export function jsxDEV<Type extends Component<P>, P extends Props>(
  type: Type,
  props: P,
  _key: string,
  __source: string,
  __self: string,
) {
  return jsx(type, props);
}
