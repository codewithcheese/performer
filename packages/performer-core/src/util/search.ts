import { PerformerNode } from "../node.js";

export function search(
  from: PerformerNode,
  cb: (node: PerformerNode) => boolean,
): PerformerNode | null {
  let cursor: PerformerNode | undefined = from;
  while (cursor) {
    const result = cb(cursor);
    if (result) {
      return cursor;
    }
    if (cursor.child) {
      cursor = cursor.child;
      continue;
    }
    while (cursor) {
      if (cursor.nextSibling) {
        cursor = cursor.nextSibling;
        break;
      }
      cursor = cursor.parent;
    }
  }
  return null;
}
