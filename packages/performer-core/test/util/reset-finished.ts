import { Performer } from "../../src/index.js";
import log from "loglevel";

export function resetFinished(performer: Performer) {
  // if external changes were applied without reset then waitUntilSettled would resolve before the changes propagated
  try {
    performer.hasFinished = false;
    performer.waitUntilFinished = new Promise<void>((resolve) => {
      performer.finish = () => {
        try {
          resolve();
        } catch (e) {
          console.error(e);
        }
      };
    })
      .catch(console.error)
      .finally(() => {
        log.debug(`Performer finished`);
        performer.hasFinished = true;
      });
  } finally {
    console.log("Finished reset");
  }
}
