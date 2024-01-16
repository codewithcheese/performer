import type { Component } from '../component.js';
import { useAfterChildren, useState } from '../hooks/index.js';
import { Signal } from '@preact/signals-core';

/**
 *	Repeat the children indefinitely unless limited using times prop or stopped with a signal.
 *
 *  Signal is used for stop instead of a boolean so that setting stop does not cause a rerender, which would lose the `n` state.
 */
export const Repeat: Component<{ times?: number; stop?: Signal<boolean> }> = ({
	children,
	times = Infinity,
	stop = new Signal(false)
}) => {
	const n = useState(1);
	useAfterChildren(() => {
		if (stop.value || n.value >= times) {
			return false;
		}
		n.value += 1;
		return true;
	});
	return () => Array(n.value).fill(children).flat();
};
