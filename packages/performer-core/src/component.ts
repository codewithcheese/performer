import type { CoreElement } from "./element.js";

export type Props = Record<string, any>;

export type View = () => CoreElement[] | CoreElement | void | null | undefined | false | string;

export type Component<P extends Props> = {
	// The main action function
	(
		props: P & {
			children?: CoreElement | CoreElement[] | string;
			content?: string;
			controller?: AbortController;
		}
	): View | Promise<View>;
};
