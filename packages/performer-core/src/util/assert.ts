export function assertTrue(value: any, text: string): asserts value is true {
  if (!__DEV__) {
    return;
  }
  if (value === true) {
    return;
  }
  throw Error(text);
}

export function assertTruthy(value: any, text: string): asserts value is true {
  if (!__DEV__) {
    return;
  }
  if (value) {
    return;
  }
  throw Error(text);
}
