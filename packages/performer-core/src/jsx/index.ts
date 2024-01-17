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
      ({ content: UserMessage["content"] } | { children: string });
    assistant: IntrinsicProps &
      Omit<AssistantMessage, "content" | "role"> &
      ({ content: AssistantMessage["content"] } | { children: string });
    system: IntrinsicProps &
      ({ content: SystemMessage["content"] } | { children: string | string[] });
    tool: IntrinsicProps &
      (
        | { id: ToolMessage["id"]; content?: ToolMessage["content"] }
        | { children: string }
      );
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
  type: Type,
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
      const countString = props.children.filter(
        (prop: any) => typeof prop === "string",
      ).length;
      if (countString && countString !== props.children.length) {
        // throw if only subset is string
        throw Error(
          `Element children cannot contain both text and objects. Found in ${type.name}`,
        );
      } else if (countString) {
        // concatenate if all are string
        // @ts-ignore
        props.content = props.children.join("");
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
