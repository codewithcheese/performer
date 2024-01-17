import { Performer } from "../../src/index.js";
import log from "loglevel";

export function resetFinished(performer: Performer) {
  // reset finished since applying unregistered external change
  performer.hasFinished = false;
  performer.waitUntilFinished = new Promise<void>(
    (resolve) => (performer.finish = resolve),
  )
    .then(() => {
      log.debug(`Session finished ${performer.id}`);
      performer.hasFinished = true;
    })
    .catch(console.error);
}
