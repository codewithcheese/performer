import { PerformerNode } from "../node.js";

export function walk(
  node: PerformerNode,
  cb: (node: PerformerNode) => boolean,
) {
  let cursor: PerformerNode | undefined = node;
  while (cursor) {
    const result = cb(cursor);
    if (!result) {
      break;
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
}
