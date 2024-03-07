import {
  hydrate,
  Performer,
  resolveMessages,
  serialize,
} from "../../src/index.js";
import { diff } from "deep-diff";
import * as _ from "lodash-es";
import { Signal } from "@preact/signals-core";
import { expect } from "vitest";
import { logger } from "../../src/util/log.js";

export async function testHydration(performer: Performer) {
  if (!performer.root) {
    throw Error("Cannot test hydration Performer.node undefined");
  }
  logger.info("Testing hydration...");
  const original = performer.root;
  const ogMessages = structuredClone(resolveMessages(performer.root));
  const serialized = serialize(performer.root);
  const stringified = JSON.stringify(serialized);
  const hydratedPerformer = new Performer(performer.app);
  const hydrated = await hydrate({
    performer: hydratedPerformer,
    element: performer.app,
    serialized,
  });
  const hydratedMessages = resolveMessages(hydratedPerformer.root);
  expect(ogMessages).toEqual(hydratedMessages);
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
      key === "onResolved" ||
      key === "afterChildren"
    ) {
      return true;
    }

    let dotPath = [...path, key].join(".");
    const lhsVal = _.get(lhs, dotPath);
    const rhsVal = _.get(rhs, dotPath);

    // filter out signals with the same value
    if (lhsVal instanceof Signal && rhsVal instanceof Signal) {
      if (_.isEqual(lhsVal.peek(), rhsVal.peek())) {
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
      key === "hasFinished" ||
      key === "options"
    ) {
      return true;
    }

    return false;
  };
}
