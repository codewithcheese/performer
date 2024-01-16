import { CoreEvent } from '../event.js';
import { useRenderScope } from './use-render-scope.js';

export function useAnnounce() {
	const scope = useRenderScope();
	return (event: CoreEvent) => scope.session.announce(event);
}
