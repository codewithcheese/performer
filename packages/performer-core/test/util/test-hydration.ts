import { hydrate, Performer, serialize } from "../../src/index.js";
import { diff } from "deep-diff";
import * as _ from "lodash";
import { Signal } from "@preact/signals-core";

export async function testHydration(performer: Performer) {
  if (!performer.node) {
    throw Error("Cannot test hydration Performer.node undefined");
  }
  const original = performer.node;
  const serialized = serialize(performer.node);
  JSON.stringify(serialized);
  const hydratedPerformer = new Performer({ element: performer.element });
  const hydrated = await hydrate(
    hydratedPerformer,
    performer.element,
    serialized,
  );
  // @ts-ignore
  const diffs = diff(original, hydrated, filterTransient(original, hydrated));
  if (diffs?.length) {
    throw Error(`Diff found between original node and hydrated node.
    
    N - indicates a newly added property/element
    D - indicates a property/element was deleted
    E - indicates a property/element was edited
    A - indicates a change occurred within an array
    ${diffs.map((d) => `\nDiff kind ${d.kind} at ${d.path?.join(".")}`)}`);
  }
  const performerDiffs = diff(
    performer,
    hydratedPerformer,
    filterTransient(performer, hydratedPerformer),
  );
  if (performerDiffs?.length) {
    throw Error(`Diff found between original Performer and hydrated Performer.
    
    N - indicates a newly added property/element
    D - indicates a property/element was deleted
    E - indicates a property/element was edited
    A - indicates a change occurred within an array
    ${performerDiffs.map((d) => `\nDiff kind ${d.kind} at ${d.path?.join(".")}`)}`);
  }
  return hydratedPerformer;
}

function filterTransient(lhs: any, rhs: any) {
  return (path: any[], key: any): boolean => {
    // filter out node circular references and transient functions
    if (
      key === "disposeView" ||
      key === "parent" ||
      key === "prevSibling" ||
      key === "onMessage" ||
      key === "afterChildren"
    ) {
      return true;
    }

    let dotPath = [...path, key].join(".");
    const lhsVal = _.get(lhs, dotPath);
    const rhsVal = _.get(rhs, dotPath);

    // filter out signals with the same value
    if (lhsVal instanceof Signal && rhsVal instanceof Signal) {
      if (lhsVal.peek() === rhsVal.peek()) {
        return true;
      }
    }

    // filter out input hook promise callbacks
    if (
      path.length &&
      path[path.length - 1] === "input" &&
      (key === "resolve" || key === "reject")
    ) {
      return true;
    }

    // filter out Performer promises
    if (
      key === "renderPromised" ||
      key === "listen" ||
      key === "finish" ||
      key === "hasFinished"
    ) {
      return true;
    }

    return false;
  };
}
