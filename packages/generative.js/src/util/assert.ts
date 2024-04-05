export function assertTrue(value: any, text: string): asserts value is true {
  if (!__DEV__) {
    return;
  }
  if (value === true) {
    return;
  }
  throw Error(text);
}

export function assertExists(value: any, text: string): asserts value is true {
  if (!__DEV__) {
    return;
  }
  if (value != null) {
    return;
  }
  throw Error(text);
}
