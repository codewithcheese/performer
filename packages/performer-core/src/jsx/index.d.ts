import { type Component, type CoreElement } from '../index.ts';

type Props = Record<string, any>;

export namespace JSX {
	export type ElementType = Component<any>;
	export type Element = CoreElement;
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
): CoreElement;
declare function jsxs<Type extends Component<P>, P extends Record<string, any>>(
	type: Type,
	props: P,
	...children: any
): CoreElement;
declare function jsxDEV<Type extends Component<P>, P extends Record<string, any>>(
	type: Type,
	props: P,
	...children: any
): CoreElement;

// export function jsxTemplate(template: string[], ...expressions: any[]): VNode<any>;
// export function jsxAttr(name: string, value: any): string | null;
// export function jsxEscape<T>(value: T): string | null | VNode<any> | Array<string | null | VNode>;
