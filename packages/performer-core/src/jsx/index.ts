import type { Component } from "../component.js";
import type { PerformerElement } from "../element.js";
import {
  AssistantMessage,
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
        | { id: ToolMessage["id"]; content?: ToolMessage["content"] }
        | { children: string | string[] }
      );
    raw: IntrinsicProps & {
      message?: PerformerMessage;
      stream?: ReadableStream<PerformerMessage>;
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

export function jsx<Type extends Component<P>, P extends Props>(
  type: Type | PerformerMessage["role"] | "raw",
  props: P,
): PerformerElement {
  if (type === undefined) {
    // @ts-ignore
    type = Fragment;
  }
  if (props.children == null) {
    props.children = [];
  } else if (typeof props.children === "string") {
    // move single text child to content prop
    // @ts-ignore
    props.content = props.children;
    props.children = [];
  } else if (typeof props.children === "object") {
    if (Array.isArray(props.children)) {
      const children = props.children.flat(9);
      const countString = children.filter(
        (child: any) => child == null || typeof child === "string",
      ).length;
      if (countString && countString !== children.length) {
        // throw if only subset is string
        const strIndex = children.findIndex(
          (child) => child == null || typeof child === "string",
        );
        const objIndex = children.findIndex(
          (child) => typeof child === "object",
        );
        throw Error(
          `Element children cannot contain both strings (index: ${strIndex}) and objects (index: ${objIndex}). ` +
            `Found in ${typeof type === "string" ? type : type.name}`,
        );
      } else if (countString) {
        // concatenate if all are string
        // @ts-ignore
        props.content = children.join("");
        props.children = [];
      }
    } else {
      // move object child to array
      props.children = [props.children];
    }
  }

  return {
    type,
    // @ts-expect-error for debugging
    _typeName: type?.name,
    props,
  };
}

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
