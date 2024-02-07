import { PerformerNode } from "../../src/index.js";
import { expect, it } from "vitest";

export type ExpectNode = {
  type: string | Function;
  children?: ExpectNode[];
};

export function expectTree(
  actual: PerformerNode | undefined,
  expected: ExpectNode,
  path: string = "root",
) {
  if (!actual) {
    expect.fail(`Expected node at path ${path} but found none`);
    return;
  }

  // Correctly check the type of `actual.type` and `expected.type`
  const actualType =
    typeof actual.type === "function" ? actual.type.name : actual.type;
  const expectedType =
    typeof expected.type === "function" ? expected.type.name : expected.type;

  // Use `actualType` and `expectedType` to make a more accurate comparison
  expect(actualType, `Unexpected node.type at ${path}`).toEqual(expectedType);

  if (expected.children) {
    let actualChild = actual.child;
    expected.children.forEach((childNode, index) => {
      // Update the path to reflect actual traversal path
      const childPath = `${path}.child[${index}]`;
      expectTree(actualChild, childNode, childPath);
      actualChild = actualChild?.nextSibling;
    });

    // Check for unexpected additional children in the actual node
    expect(
      actualChild,
      `Unexpected additional child node at path ${path} beyond defined children`,
    ).toBeUndefined();
  }
}
