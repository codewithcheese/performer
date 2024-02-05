// https://github.com/BuilderIO/qwik/blob/main/packages/qwik/src/core/error/assert.ts

export function assertTrue(value: any, text: string): asserts value is true {
  if (value === true) {
    return;
  }
  throw Error(text);
}
