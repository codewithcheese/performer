import { PerformerNode } from "../../src/index.js";
import { expect, it } from "vitest";

export type ExpectNode = {
  type: string | Function;
  children?: ExpectNode[];
  props?: Record<string, any>;
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

  const actualType =
    typeof actual.action === "function" ? actual.action.name : actual.action;
  const expectedType =
    typeof expected.type === "function" ? expected.type.name : expected.type;

  expect(actualType, `Unexpected node.type at ${path}`).toEqual(expectedType);

  // Check if the actual node props include at least the expected props
  if (expected.props) {
    Object.entries(expected.props).forEach(([key, value]) => {
      expect(
        actual.props[key],
        `Prop mismatch at path ${path}.props.${key}`,
      ).toEqual(value);
    });
  }

  if (expected.children) {
    let actualChild = actual.child;
    expected.children.forEach((childNode, index) => {
      const childPath = `${path}.children[${index}]`;
      expectTree(actualChild, childNode, childPath);
      actualChild = actualChild?.nextSibling;
    });

    expect(
      actualChild,
      `Unexpected additional child node at path ${path} beyond defined children`,
    ).toBeUndefined();
  }
}
