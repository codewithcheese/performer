import { type Component, type PerformerElement } from "../index.ts";

type Props = Record<string, any>;

export namespace JSX {
  export type ElementType = Component<any>;
  export type Element = PerformerElement;
  // export type ElementClass = Component<any, any> | FunctionComponent<any>;
  // interface ElementChildrenAttribute {
  // 	children: CoreElement | string;
  // }
  interface IntrinsicElements {
    // No intrinsic elements are allowed
  }
}

declare function jsx<Type extends Component<P>, P extends Record<string, any>>(
  type: Type,
  props: P,
  ...children: any
): PerformerElement;
declare function jsxs<Type extends Component<P>, P extends Record<string, any>>(
  type: Type,
  props: P,
  ...children: any
): PerformerElement;
declare function jsxDEV<
  Type extends Component<P>,
  P extends Record<string, any>,
>(type: Type, props: P, ...children: any): PerformerElement;

// export function jsxTemplate(template: string[], ...expressions: any[]): VNode<any>;
// export function jsxAttr(name: string, value: any): string | null;
// export function jsxEscape<T>(value: T): string | null | VNode<any> | Array<string | null | VNode>;
