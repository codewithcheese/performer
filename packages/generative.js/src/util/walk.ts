import { GenerativeNode } from "../node.js";

export function walk(
  node: GenerativeNode,
  cb: (node: GenerativeNode) => boolean,
) {
  let cursor: GenerativeNode | undefined = node;
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
