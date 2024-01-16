import { RunSession } from '../../src/index.js';
import log from 'loglevel';

export function resetFinished(session: RunSession) {
	// reset finished since applying unregistered external change
	session.hasFinished = false;
	session.waitUntilFinished = new Promise<void>((resolve) => (session.finish = resolve))
		.then(() => {
			log.debug(`Session finished ${session.id}`);
			session.hasFinished = true;
		})
		.catch(console.error);
}
